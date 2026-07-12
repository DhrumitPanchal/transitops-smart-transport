const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const AppError = require("../../common/AppError");
const { emitDomainEvent, serializeValue } = require("../../utils/socketEmitter");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const generateTripNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRP-${timestamp}-${random}`;
};

const getTrips = async ({
  page = 1,
  limit = 10,
  search,
  status,
  vehicleId,
  driverId,
  fromDate,
  toDate,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { tripNumber: { contains: search, mode: "insensitive" } },
              { source: { contains: search, mode: "insensitive" } },
              { destination: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
      vehicleId ? { vehicleId } : {},
      driverId ? { driverId } : {},
      fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {},
    ].filter(Boolean),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        tripNumber: true,
        vehicleId: true,
        driverId: true,
        source: true,
        destination: true,
        cargo: true,
        cargoWeight: true,
        distance: true,
        plannedStart: true,
        plannedEnd: true,
        actualStart: true,
        actualEnd: true,
        startOdometer: true,
        finalOdometer: true,
        remarks: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            vehicleName: true,
            vehicleType: true,
          },
        },
        driver: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    }),
    prisma.trip.count({ where }),
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

const getTripById = async (id) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      id: true,
      tripNumber: true,
      vehicleId: true,
      driverId: true,
      source: true,
      destination: true,
      cargo: true,
      cargoWeight: true,
      distance: true,
      plannedStart: true,
      plannedEnd: true,
      actualStart: true,
      actualEnd: true,
      startOdometer: true,
      finalOdometer: true,
      fuelConsumed: true,
      remarks: true,
      status: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          vehicleName: true,
          vehicleType: true,
          capacity: true,
          currentOdometer: true,
        },
      },
      driver: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          phone: true,
          licenseNumber: true,
          licenseCategory: true,
        },
      },
      fuelLogs: {
        select: {
          id: true,
          fuelDate: true,
          liters: true,
          pricePerLiter: true,
          totalCost: true,
          odometer: true,
          station: true,
        },
      },
      expenses: {
        select: {
          id: true,
          expenseType: true,
          amount: true,
          expenseDate: true,
          description: true,
          billNumber: true,
        },
      },
    },
  });

  if (!trip) {
    throw new AppError(404, "Trip not found");
  }

  return trip;
};

const createTrip = async (data, userId, meta = {}) => {
  const {
    vehicleId,
    driverId,
    source,
    destination,
    cargo,
    cargoWeight,
    distance,
    plannedStart,
    plannedEnd,
    remarks,
  } = data;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId, isDeleted: false },
  });

  if (!vehicle) {
    throw new AppError(404, "Vehicle not found");
  }

  const driver = await prisma.driver.findUnique({
    where: { id: driverId, isDeleted: false },
  });

  if (!driver) {
    throw new AppError(404, "Driver not found");
  }

  if (new Date(plannedEnd) <= new Date(plannedStart)) {
    throw new AppError(400, "Planned end time must be after planned start time");
  }

  if (source === destination) {
    throw new AppError(400, "Source and destination cannot be the same");
  }

  if (cargoWeight !== undefined && cargoWeight < 0) {
    throw new AppError(400, "Cargo weight cannot be negative");
  }

  const tripNumber = generateTripNumber();

  const trip = await prisma.trip.create({
    data: {
      tripNumber,
      vehicleId,
      driverId,
      source,
      destination,
      cargo,
      cargoWeight,
      distance,
      plannedStart: new Date(plannedStart),
      plannedEnd: new Date(plannedEnd),
      remarks,
      status: "DRAFT",
      createdBy: userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "TRIP",
      action: "CREATE",
      recordId: trip.id,
      newValue: trip,
    },
  });

  emitDomainEvent("trip.created", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { trip: serializeValue(trip) },
    dashboardChanges: {
      pendingTrips: 1,
    },
  });

  return serializeValue(trip);
};

const updateTrip = async (id, data, userId, meta = {}) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
  });

  if (!trip) {
    throw new AppError(404, "Trip not found");
  }

  if (trip.status !== "DRAFT") {
    throw new AppError(400, "Cannot update trip that is not in DRAFT status");
  }

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId, isDeleted: false },
    });

    if (!vehicle) {
      throw new AppError(404, "Vehicle not found");
    }
  }

  if (data.driverId) {
    const driver = await prisma.driver.findUnique({
      where: { id: data.driverId, isDeleted: false },
    });

    if (!driver) {
      throw new AppError(404, "Driver not found");
    }
  }

  if (data.plannedStart && data.plannedEnd) {
    if (new Date(data.plannedEnd) <= new Date(data.plannedStart)) {
      throw new AppError(400, "Planned end time must be after planned start time");
    }
  }

  if (data.source && data.destination && data.source === data.destination) {
    throw new AppError(400, "Source and destination cannot be the same");
  }

  if (data.cargoWeight !== undefined && data.cargoWeight < 0) {
    throw new AppError(400, "Cargo weight cannot be negative");
  }

  const oldValue = { ...trip };
  delete oldValue.id;

  const updatedTrip = await prisma.trip.update({
    where: { id },
    data: {
      ...data,
      plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
      plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "TRIP",
      action: "UPDATE",
      recordId: trip.id,
      oldValue,
      newValue: updatedTrip,
    },
  });

  emitDomainEvent("trip.updated", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { trip: serializeValue(updatedTrip) },
  });

  return serializeValue(updatedTrip);
};

const dispatchTrip = async (id, userId, meta = {}) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
    },
  });

  if (!trip) {
    throw new AppError(404, "Trip not found");
  }

  if (trip.status !== "DRAFT") {
    throw new AppError(400, "Trip must be in DRAFT status to dispatch");
  }

  if (trip.vehicle.status !== "AVAILABLE") {
    throw new AppError(400, "Vehicle is not available for dispatch");
  }

  if (trip.driver.status !== "AVAILABLE") {
    throw new AppError(400, "Driver is not available for dispatch");
  }

  if (trip.driver.licenseExpiryDate && new Date(trip.driver.licenseExpiryDate) <= new Date()) {
    throw new AppError(400, "Driver license has expired");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: { status: "DISPATCHED" },
    });

    const updatedVehicle = await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "ON_TRIP" },
    });

    const updatedDriver = await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "ON_TRIP" },
    });

    await tx.auditLog.create({
      data: {
        userId,
        module: "TRIP",
        action: "DISPATCH",
        recordId: trip.id,
        oldValue: { status: "DRAFT" },
        newValue: { status: "DISPATCHED" },
      },
    });

    return { trip: updatedTrip, vehicle: updatedVehicle, driver: updatedDriver };
  });

  const payload = {
    trip: serializeValue(result.trip),
    vehicle: serializeValue(result.vehicle),
    driver: serializeValue(result.driver),
  };

  emitDomainEvent("trip.dispatched", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: payload,
    dashboardChanges: {
      pendingTrips: -1,
      activeTrips: 1,
      availableVehicles: -1,
      vehiclesOnTrip: 1,
      availableDrivers: -1,
      driversOnDuty: 1,
    },
  });

  emitDomainEvent("vehicle.status_changed", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: {
      vehicle: payload.vehicle,
      oldStatus: "AVAILABLE",
      newStatus: "ON_TRIP",
    },
  });

  emitDomainEvent("driver.status_changed", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: {
      driver: payload.driver,
      status: "ON_TRIP",
    },
  });

  return payload.trip;
};

const startTrip = async (id, data, userId, meta = {}) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
    },
  });

  if (!trip) {
    throw new AppError(404, "Trip not found");
  }

  if (trip.status !== "DISPATCHED") {
    throw new AppError(400, "Trip must be in DISPATCHED status to start");
  }

  const { startOdometer } = data;

  if (startOdometer < Number(trip.vehicle.currentOdometer)) {
    throw new AppError(400, "Start odometer cannot be less than current vehicle odometer");
  }

  const updatedTrip = await prisma.trip.update({
    where: { id },
    data: {
      status: "IN_PROGRESS",
      actualStart: new Date(),
      startOdometer,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "TRIP",
      action: "START",
      recordId: trip.id,
      oldValue: { status: "DISPATCHED" },
      newValue: { status: "IN_PROGRESS", startOdometer },
    },
  });

  emitDomainEvent("trip.started", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { trip: serializeValue(updatedTrip) },
  });

  emitDomainEvent("trip.updated", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { trip: serializeValue(updatedTrip) },
  });

  return serializeValue(updatedTrip);
};

const completeTrip = async (id, data, userId, meta = {}) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
    },
  });

  if (!trip) {
    throw new AppError(404, "Trip not found");
  }

  if (trip.status !== "IN_PROGRESS") {
    throw new AppError(400, "Trip must be in IN_PROGRESS status to complete");
  }

  const { endOdometer, remarks } = data;

  if (endOdometer <= trip.startOdometer) {
    throw new AppError(400, "End odometer must be greater than start odometer");
  }

  const travelledDistance = endOdometer - trip.startOdometer;

  const result = await prisma.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actualEnd: new Date(),
        finalOdometer: endOdometer,
        remarks: remarks || trip.remarks,
      },
    });

    const updatedVehicle = await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: "AVAILABLE",
        currentOdometer: endOdometer,
      },
    });

    const updatedDriver = await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "AVAILABLE" },
    });

    await tx.auditLog.create({
      data: {
        userId,
        module: "TRIP",
        action: "COMPLETE",
        recordId: trip.id,
        oldValue: { status: "IN_PROGRESS" },
        newValue: { status: "COMPLETED", finalOdometer: endOdometer },
      },
    });

    return { trip: updatedTrip, vehicle: updatedVehicle, driver: updatedDriver };
  });

  const payload = {
    trip: serializeValue(result.trip),
    vehicle: serializeValue(result.vehicle),
    driver: serializeValue(result.driver),
  };

  emitDomainEvent("trip.completed", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: payload,
    dashboardChanges: {
      activeTrips: -1,
      availableVehicles: 1,
      vehiclesOnTrip: -1,
      availableDrivers: 1,
      driversOnDuty: -1,
    },
  });

  emitDomainEvent("vehicle.status_changed", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: {
      vehicle: payload.vehicle,
      oldStatus: "ON_TRIP",
      newStatus: "AVAILABLE",
    },
  });

  emitDomainEvent("driver.status_changed", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: {
      driver: payload.driver,
      status: "AVAILABLE",
    },
  });

  return payload.trip;
};

const cancelTrip = async (id, data, userId, meta = {}) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
    },
  });

  if (!trip) {
    throw new AppError(404, "Trip not found");
  }

  if (trip.status === "COMPLETED") {
    throw new AppError(400, "Cannot cancel a completed trip");
  }

  const { reason } = data;

  const previousStatus = trip.status;

  const result = await prisma.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: {
        status: "CANCELLED",
        remarks: reason,
      },
    });

    let updatedVehicle = trip.vehicle;
    let updatedDriver = trip.driver;

    if (trip.status === "DISPATCHED" || trip.status === "IN_PROGRESS") {
      updatedVehicle = await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE" },
      });

      updatedDriver = await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: "AVAILABLE" },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        module: "TRIP",
        action: "CANCEL",
        recordId: trip.id,
        oldValue: { status: trip.status },
        newValue: { status: "CANCELLED", reason },
      },
    });

    return { trip: updatedTrip, vehicle: updatedVehicle, driver: updatedDriver };
  });

  const payload = {
    trip: serializeValue(result.trip),
    vehicle: serializeValue(result.vehicle),
    driver: serializeValue(result.driver),
  };

  const wasActive =
    previousStatus === "DISPATCHED" || previousStatus === "IN_PROGRESS";

  emitDomainEvent("trip.cancelled", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: {
      ...payload,
      reason,
    },
    dashboardChanges: {
      pendingTrips: previousStatus === "DRAFT" ? -1 : 0,
      activeTrips: wasActive ? -1 : 0,
      availableVehicles: wasActive ? 1 : 0,
      vehiclesOnTrip: wasActive ? -1 : 0,
      availableDrivers: wasActive ? 1 : 0,
      driversOnDuty: wasActive ? -1 : 0,
    },
  });

  if (wasActive) {
    emitDomainEvent("vehicle.status_changed", {
      actorUserId: userId,
      excludeSocketId: meta.socketId,
      data: {
        vehicle: payload.vehicle,
        oldStatus: "ON_TRIP",
        newStatus: "AVAILABLE",
      },
    });

    emitDomainEvent("driver.status_changed", {
      actorUserId: userId,
      excludeSocketId: meta.socketId,
      data: {
        driver: payload.driver,
        status: "AVAILABLE",
      },
    });
  }

  return payload.trip;
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  dispatchTrip,
  startTrip,
  completeTrip,
  cancelTrip,
};
