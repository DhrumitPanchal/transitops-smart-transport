const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const AppError = require("../../common/AppError");
const { emitToAll, emitToRole } = require("../../utils/socketEmitter");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getDrivers = async ({
  page = 1,
  limit = 10,
  search,
  status,
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
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { employeeCode: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { licenseNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
    ].filter(Boolean),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        licenseNumber: true,
        licenseCategory: true,
        licenseExpiryDate: true,
        safetyScore: true,
        status: true,
        joiningDate: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.driver.count({ where }),
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

const getDriverById = async (id) => {
  const driver = await prisma.driver.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      licenseNumber: true,
      licenseCategory: true,
      licenseExpiryDate: true,
      safetyScore: true,
      address: true,
      status: true,
      joiningDate: true,
      createdAt: true,
      updatedAt: true,
      trips: {
        where: { status: { in: ["DISPATCHED"] } },
        select: {
          id: true,
          tripNumber: true,
          source: true,
          destination: true,
          status: true,
          plannedStart: true,
          plannedEnd: true,
        },
        take: 1,
      },
      _count: {
        select: {
          trips: true,
        },
      },
    },
  });

  if (!driver) {
    throw new AppError(404, "Driver not found");
  }

  return driver;
};

const createDriver = async (data, userId) => {
  const {
    employeeCode,
    firstName,
    lastName,
    phone,
    email,
    licenseNumber,
    licenseCategory,
    licenseExpiryDate,
    joiningDate,
    address,
    safetyScore,
  } = data;

  const existingEmployeeCode = await prisma.driver.findUnique({
    where: { employeeCode },
  });

  if (existingEmployeeCode) {
    throw new AppError(400, "Employee code already exists");
  }

  const existingPhone = await prisma.driver.findUnique({
    where: { phone },
  });

  if (existingPhone) {
    throw new AppError(400, "Phone number already exists");
  }

  if (email) {
    const existingEmail = await prisma.driver.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new AppError(400, "Email already exists");
    }
  }

  const existingLicense = await prisma.driver.findUnique({
    where: { licenseNumber },
  });

  if (existingLicense) {
    throw new AppError(400, "License number already exists");
  }

  if (licenseExpiryDate && new Date(licenseExpiryDate) <= new Date()) {
    throw new AppError(400, "License expiry date must be in the future");
  }

  if (joiningDate && new Date(joiningDate) > new Date()) {
    throw new AppError(400, "Joining date cannot be in the future");
  }

  if (safetyScore !== undefined && (safetyScore < 0 || safetyScore > 100)) {
    throw new AppError(400, "Safety score must be between 0 and 100");
  }

  const driver = await prisma.driver.create({
    data: {
      employeeCode,
      firstName,
      lastName,
      phone,
      email,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      address,
      safetyScore: safetyScore || 100,
      status: "AVAILABLE",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "DRIVER",
      action: "CREATE",
      recordId: driver.id,
      newValue: driver,
    },
  });

  emitToAll("driver.created", {
    driverId: driver.id,
  });

  return driver;
};

const updateDriver = async (id, data, userId) => {
  const driver = await prisma.driver.findUnique({
    where: { id, isDeleted: false },
  });

  if (!driver) {
    throw new AppError(404, "Driver not found");
  }

  if (data.employeeCode && data.employeeCode !== driver.employeeCode) {
    const existingEmployeeCode = await prisma.driver.findUnique({
      where: { employeeCode: data.employeeCode },
    });

    if (existingEmployeeCode) {
      throw new AppError(400, "Employee code already exists");
    }
  }

  if (data.phone && data.phone !== driver.phone) {
    const existingPhone = await prisma.driver.findUnique({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new AppError(400, "Phone number already exists");
    }
  }

  if (data.email && data.email !== driver.email) {
    const existingEmail = await prisma.driver.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError(400, "Email already exists");
    }
  }

  if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
    if (driver.status === "ON_TRIP") {
      throw new AppError(400, "Cannot edit license number while driver is on trip");
    }

    const existingLicense = await prisma.driver.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingLicense) {
      throw new AppError(400, "License number already exists");
    }
  }

  if (data.licenseExpiryDate && new Date(data.licenseExpiryDate) <= new Date()) {
    throw new AppError(400, "License expiry date must be in the future");
  }

  if (data.safetyScore !== undefined && (data.safetyScore < 0 || data.safetyScore > 100)) {
    throw new AppError(400, "Safety score must be between 0 and 100");
  }

  const oldValue = { ...driver };
  delete oldValue.id;

  const updatedDriver = await prisma.driver.update({
    where: { id },
    data: {
      ...data,
      licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : undefined,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "DRIVER",
      action: "UPDATE",
      recordId: driver.id,
      oldValue,
      newValue: updatedDriver,
    },
  });

  emitToAll("driver.updated", {
    driverId: driver.id,
  });

  return updatedDriver;
};

const changeDriverStatus = async (id, status, userId) => {
  const driver = await prisma.driver.findUnique({
    where: { id, isDeleted: false },
  });

  if (!driver) {
    throw new AppError(404, "Driver not found");
  }

  const validStatuses = ["AVAILABLE", "OFF_DUTY", "SUSPENDED"];
  if (!validStatuses.includes(status)) {
    throw new AppError(400, "Invalid status");
  }

  if (driver.status === "ON_TRIP") {
    throw new AppError(400, "Cannot change status while driver is on trip");
  }

  if (status === "AVAILABLE") {
    if (driver.licenseExpiryDate && new Date(driver.licenseExpiryDate) <= new Date()) {
      throw new AppError(400, "Cannot set AVAILABLE if license has expired");
    }
  }

  const oldValue = { ...driver };
  delete oldValue.id;

  const updatedDriver = await prisma.driver.update({
    where: { id },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "DRIVER",
      action: "STATUS_CHANGE",
      recordId: driver.id,
      oldValue: { status: oldValue.status },
      newValue: { status: updatedDriver.status },
    },
  });

  emitToAll("driver.status_changed", {
    driverId: driver.id,
    status: updatedDriver.status,
  });

  return updatedDriver;
};

const deleteDriver = async (id, userId) => {
  const driver = await prisma.driver.findUnique({
    where: { id, isDeleted: false },
  });

  if (!driver) {
    throw new AppError(404, "Driver not found");
  }

  const activeTrip = await prisma.trip.findFirst({
    where: {
      driverId: id,
      status: { in: ["DISPATCHED"] },
    },
  });

  if (activeTrip) {
    throw new AppError(400, "Cannot delete driver assigned to an active trip");
  }

  if (driver.status === "SUSPENDED") {
    throw new AppError(400, "Cannot delete suspended driver with pending investigation");
  }

  const oldValue = { ...driver };
  delete oldValue.id;

  await prisma.driver.update({
    where: { id },
    data: { isDeleted: true },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "DRIVER",
      action: "DELETE",
      recordId: driver.id,
      oldValue,
    },
  });

  emitToRole("Super Admin", "driver.deleted", {
    driverId: driver.id,
  });

  return { message: "Driver archived successfully" };
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  changeDriverStatus,
  deleteDriver,
};
