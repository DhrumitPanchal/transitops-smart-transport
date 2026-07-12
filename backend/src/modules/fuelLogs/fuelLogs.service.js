const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const AppError = require("../../common/AppError");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getFuelLogs = async ({
  page = 1,
  limit = 10,
  vehicleId,
  driverId,
  tripId,
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
      { isDeleted: false },
      vehicleId ? { vehicleId } : {},
      driverId ? { driverId } : {},
      tripId ? { tripId } : {},
      fromDate || toDate
        ? {
            fuelDate: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {},
    ].filter(Boolean),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.vehicleFuelLog.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        vehicleId: true,
        driverId: true,
        tripId: true,
        fuelStation: true,
        fuelType: true,
        quantity: true,
        pricePerUnit: true,
        totalAmount: true,
        odometerReading: true,
        fuelDate: true,
        receiptNumber: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            vehicleName: true,
          },
        },
      },
    }),
    prisma.vehicleFuelLog.count({ where }),
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

const getFuelLogById = async (id) => {
  const fuelLog = await prisma.vehicleFuelLog.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      vehicleId: true,
      driverId: true,
      tripId: true,
      fuelStation: true,
      fuelType: true,
      quantity: true,
      pricePerUnit: true,
      totalAmount: true,
      odometerReading: true,
      fuelDate: true,
      receiptNumber: true,
      remarks: true,
      createdBy: true,
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
      trip: {
        select: {
          id: true,
          tripNumber: true,
          source: true,
          destination: true,
        },
      },
    },
  });

  if (!fuelLog) {
    throw new AppError(404, "Fuel log not found");
  }

  return fuelLog;
};

const createFuelLog = async (data, userId) => {
  const {
    vehicleId,
    driverId,
    tripId,
    fuelStation,
    fuelType,
    quantity,
    pricePerUnit,
    odometerReading,
    fuelDate,
    receiptNumber,
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

  if (tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new AppError(404, "Trip not found");
    }
  }

  if (quantity <= 0) {
    throw new AppError(400, "Quantity must be greater than 0");
  }

  if (pricePerUnit <= 0) {
    throw new AppError(400, "Price per unit must be greater than 0");
  }

  if (odometerReading < Number(vehicle.currentOdometer)) {
    throw new AppError(400, "Odometer reading cannot be less than current vehicle odometer");
  }

  const totalAmount = quantity * pricePerUnit;

  const fuelLog = await prisma.vehicleFuelLog.create({
    data: {
      vehicleId,
      driverId,
      tripId,
      fuelStation,
      fuelType,
      quantity,
      pricePerUnit,
      totalAmount,
      odometerReading,
      fuelDate: new Date(fuelDate),
      receiptNumber,
      remarks,
      createdBy: userId,
    },
  });

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { currentOdometer: odometerReading },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "FUEL_LOG",
      action: "CREATE",
      recordId: fuelLog.id,
      newValue: fuelLog,
    },
  });

  return fuelLog;
};

const updateFuelLog = async (id, data, userId) => {
  const fuelLog = await prisma.vehicleFuelLog.findUnique({
    where: { id, isDeleted: false },
  });

  if (!fuelLog) {
    throw new AppError(404, "Fuel log not found");
  }

  if (data.quantity !== undefined && data.quantity <= 0) {
    throw new AppError(400, "Quantity must be greater than 0");
  }

  if (data.pricePerUnit !== undefined && data.pricePerUnit <= 0) {
    throw new AppError(400, "Price per unit must be greater than 0");
  }

  let totalAmount = fuelLog.totalAmount;
  if (data.quantity !== undefined || data.pricePerUnit !== undefined) {
    const quantity = data.quantity !== undefined ? data.quantity : fuelLog.quantity;
    const pricePerUnit = data.pricePerUnit !== undefined ? data.pricePerUnit : fuelLog.pricePerUnit;
    totalAmount = quantity * pricePerUnit;
  }

  const oldValue = { ...fuelLog };
  delete oldValue.id;

  const updatedFuelLog = await prisma.vehicleFuelLog.update({
    where: { id },
    data: {
      ...data,
      totalAmount,
      fuelDate: data.fuelDate ? new Date(data.fuelDate) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "FUEL_LOG",
      action: "UPDATE",
      recordId: fuelLog.id,
      oldValue,
      newValue: updatedFuelLog,
    },
  });

  return updatedFuelLog;
};

const deleteFuelLog = async (id, userId) => {
  const fuelLog = await prisma.vehicleFuelLog.findUnique({
    where: { id, isDeleted: false },
  });

  if (!fuelLog) {
    throw new AppError(404, "Fuel log not found");
  }

  const oldValue = { ...fuelLog };
  delete oldValue.id;

  await prisma.vehicleFuelLog.update({
    where: { id },
    data: { isDeleted: true },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "FUEL_LOG",
      action: "DELETE",
      recordId: fuelLog.id,
      oldValue,
    },
  });

  return { message: "Fuel log archived successfully" };
};

module.exports = {
  getFuelLogs,
  getFuelLogById,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
};
