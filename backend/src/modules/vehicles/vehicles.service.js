const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const AppError = require("../../common/AppError");
const { emitDomainEvent, serializeValue } = require("../../utils/socketEmitter");
const { resolveSortBy, resolveSortOrder } = require("../../common/sort");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const VEHICLE_SORT_FIELDS = new Set([
  "registrationNumber",
  "vehicleName",
  "vehicleType",
  "capacity",
  "currentOdometer",
  "purchaseCost",
  "manufactureYear",
  "region",
  "status",
  "createdAt",
  "updatedAt",
]);

const VEHICLE_SORT_ALIASES = {
  name: "vehicleName",
  type: "vehicleType",
  odometer: "currentOdometer",
  acquisitionCost: "purchaseCost",
};

const getVehicles = async ({
  page = 1,
  limit = 10,
  search,
  status,
  type,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;
  const safeSortBy = resolveSortBy(sortBy, {
    allowed: VEHICLE_SORT_FIELDS,
    aliases: VEHICLE_SORT_ALIASES,
    fallback: "createdAt",
  });
  const safeSortOrder = resolveSortOrder(sortOrder);

  const where = {
    AND: [
      { isDeleted: false },
      search
        ? {
            OR: [
              { registrationNumber: { contains: search, mode: "insensitive" } },
              { vehicleName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
      type ? { vehicleType: type } : {},
    ].filter((clause) => Object.keys(clause).length > 0),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [safeSortBy]: safeSortOrder },
      select: {
        id: true,
        registrationNumber: true,
        vehicleName: true,
        vehicleType: true,
        capacity: true,
        currentOdometer: true,
        purchaseCost: true,
        manufactureYear: true,
        region: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / safeLimit),
    },
  };
};

const getVehicleById = async (id) => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, isDeleted: false },
    select: {
      id: true,
      registrationNumber: true,
      vehicleName: true,
      vehicleType: true,
      capacity: true,
      currentOdometer: true,
      purchaseCost: true,
      manufactureYear: true,
      region: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      documents: {
        select: {
          id: true,
          documentType: true,
          number: true,
          expiryDate: true,
          fileUrl: true,
        },
      },
      maintenances: {
        where: {
          isDeleted: false,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        },
        select: {
          id: true,
          maintenanceType: true,
          title: true,
          status: true,
          scheduledDate: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          trips: true,
          fuelLogs: true,
          expenses: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new AppError(404, "Vehicle not found");
  }

  return serializeValue(vehicle);
};

const createVehicle = async (data, userId, meta = {}) => {
  const {
    registrationNumber,
    vehicleName,
    vehicleType,
    capacity,
    manufactureYear,
    purchaseCost,
    currentOdometer,
    region,
  } = data;

  const existingVehicle = await prisma.vehicle.findUnique({
    where: { registrationNumber },
  });

  if (existingVehicle) {
    throw new AppError(400, "Registration number already exists");
  }

  if (capacity <= 0) {
    throw new AppError(400, "Capacity must be greater than 0");
  }

  if (currentOdometer < 0) {
    throw new AppError(400, "Odometer reading cannot be negative");
  }

  if (manufactureYear > new Date().getFullYear()) {
    throw new AppError(400, "Manufacture year cannot be in the future");
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber,
      vehicleName,
      vehicleType,
      capacity,
      manufactureYear,
      purchaseCost,
      currentOdometer,
      region,
      status: "AVAILABLE",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "VEHICLE",
      action: "CREATE",
      recordId: vehicle.id,
      newValue: vehicle,
    },
  });

  emitDomainEvent("vehicle.created", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { vehicle: serializeValue(vehicle) },
    dashboardChanges: {
      availableVehicles: 1,
      activeVehicles: 1,
    },
  });

  return serializeValue(vehicle);
};

const updateVehicle = async (id, data, userId, meta = {}) => {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, isDeleted: false },
  });

  if (!vehicle) {
    throw new AppError(404, "Vehicle not found");
  }

  if (vehicle.status === "RETIRED") {
    throw new AppError(400, "Cannot update retired vehicle");
  }

  if (vehicle.status === "ON_TRIP") {
    const allowedFields = ["currentOdometer"];
    const attemptedFields = Object.keys(data);
    const hasInvalidField = attemptedFields.some(
      (field) => !allowedFields.includes(field)
    );

    if (hasInvalidField) {
      throw new AppError(
        400,
        "Cannot update vehicle details while on trip. Only odometer can be updated."
      );
    }
  }

  if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { registrationNumber: data.registrationNumber },
    });

    if (existingVehicle) {
      throw new AppError(400, "Registration number already exists");
    }
  }

  if (data.capacity !== undefined && data.capacity <= 0) {
    throw new AppError(400, "Capacity must be greater than 0");
  }

  if (data.currentOdometer !== undefined && data.currentOdometer < 0) {
    throw new AppError(400, "Odometer reading cannot be negative");
  }

  const oldValue = { ...vehicle };
  delete oldValue.id;

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "VEHICLE",
      action: "UPDATE",
      recordId: vehicle.id,
      oldValue,
      newValue: updatedVehicle,
    },
  });

  emitDomainEvent("vehicle.updated", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { vehicle: serializeValue(updatedVehicle) },
  });

  return serializeValue(updatedVehicle);
};

const changeVehicleStatus = async (id, status, userId, meta = {}) => {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, isDeleted: false },
  });

  if (!vehicle) {
    throw new AppError(404, "Vehicle not found");
  }

  const validStatuses = ["AVAILABLE", "IN_SHOP", "RETIRED"];
  if (!validStatuses.includes(status)) {
    throw new AppError(400, "Invalid status");
  }

  if (status === "AVAILABLE") {
    const activeMaintenance = await prisma.vehicleMaintenance.findFirst({
      where: {
        vehicleId: id,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
    });

    if (activeMaintenance) {
      throw new AppError(400, "Cannot set AVAILABLE while maintenance is active");
    }
  }

  if (status === "RETIRED" && vehicle.status === "ON_TRIP") {
    throw new AppError(400, "Cannot retire vehicle while on trip");
  }

  const oldValue = { ...vehicle };
  delete oldValue.id;

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "VEHICLE",
      action: "STATUS_CHANGE",
      recordId: vehicle.id,
      oldValue: { status: oldValue.status },
      newValue: { status: updatedVehicle.status },
    },
  });

  const serialized = serializeValue(updatedVehicle);

  emitDomainEvent("vehicle.status_changed", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: {
      vehicle: serialized,
      oldStatus: oldValue.status,
      newStatus: updatedVehicle.status,
    },
  });

  if (updatedVehicle.status === "RETIRED") {
    emitDomainEvent("vehicle.retired", {
      actorUserId: userId,
      excludeSocketId: meta.socketId,
      data: { vehicle: serialized },
      dashboardChanges: {
        availableVehicles: oldValue.status === "AVAILABLE" ? -1 : 0,
        activeVehicles: -1,
      },
    });
  }

  return serialized;
};

const deleteVehicle = async (id, userId, meta = {}) => {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, isDeleted: false },
  });

  if (!vehicle) {
    throw new AppError(404, "Vehicle not found");
  }

  if (vehicle.status !== "AVAILABLE") {
    throw new AppError(400, "Only AVAILABLE vehicles can be archived");
  }

  const activeTrip = await prisma.trip.findFirst({
    where: {
      vehicleId: id,
      status: { in: ["DISPATCHED"] },
    },
  });

  if (activeTrip) {
    throw new AppError(400, "Cannot delete vehicle with active trip");
  }

  const activeMaintenance = await prisma.vehicleMaintenance.findFirst({
    where: {
      vehicleId: id,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
  });

  if (activeMaintenance) {
    throw new AppError(400, "Cannot delete vehicle with active maintenance");
  }

  const oldValue = { ...vehicle };
  delete oldValue.id;

  await prisma.vehicle.update({
    where: { id },
    data: { isDeleted: true },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "VEHICLE",
      action: "DELETE",
      recordId: vehicle.id,
      oldValue,
    },
  });

  emitDomainEvent("vehicle.deleted", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { vehicle: serializeValue({ ...vehicle, isDeleted: true }) },
    dashboardChanges: {
      availableVehicles: vehicle.status === "AVAILABLE" ? -1 : 0,
      activeVehicles: -1,
    },
  });

  return { message: "Vehicle archived successfully" };
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  changeVehicleStatus,
  deleteVehicle,
};
