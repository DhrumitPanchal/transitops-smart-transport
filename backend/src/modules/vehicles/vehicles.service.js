const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const AppError = require("../../common/AppError");
const { emitToAll, emitToRole } = require("../../utils/socketEmitter");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
    ].filter(Boolean),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
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
  const vehicle = await prisma.vehicle.findUnique({
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
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        select: {
          id: true,
          maintenanceType: true,
          title: true,
          status: true,
          startedAt: true,
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

  return vehicle;
};

const createVehicle = async (data, userId) => {
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

  emitToAll("vehicle.created", {
    vehicleId: vehicle.id,
    registrationNumber: vehicle.registrationNumber,
    status: vehicle.status,
  });

  return vehicle;
};

const updateVehicle = async (id, data, userId) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id, isDeleted: false },
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

  emitToAll("vehicle.updated", {
    vehicleId: vehicle.id,
  });

  return updatedVehicle;
};

const changeVehicleStatus = async (id, status, userId) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id, isDeleted: false },
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
        status: { in: ["OPEN", "IN_PROGRESS"] },
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

  emitToAll("vehicle.status_changed", {
    vehicleId: vehicle.id,
    oldStatus: oldValue.status,
    newStatus: updatedVehicle.status,
  });

  return updatedVehicle;
};

const deleteVehicle = async (id, userId) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id, isDeleted: false },
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
      status: { in: ["OPEN", "IN_PROGRESS"] },
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

  emitToRole("Super Admin", "vehicle.deleted", {
    vehicleId: vehicle.id,
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
