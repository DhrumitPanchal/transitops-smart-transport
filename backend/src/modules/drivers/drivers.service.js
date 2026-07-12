const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const AppError = require("../../common/AppError");
const { emitDomainEvent, serializeValue } = require("../../utils/socketEmitter");
const { resolveSortBy, resolveSortOrder } = require("../../common/sort");
const { splitFullName } = require("../auth/auth.helpers");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DRIVER_SORT_FIELDS = new Set([
  "employeeCode",
  "firstName",
  "lastName",
  "phone",
  "email",
  "licenseNumber",
  "licenseCategory",
  "licenseExpiryDate",
  "safetyScore",
  "status",
  "joiningDate",
  "createdAt",
  "updatedAt",
]);

const DRIVER_SORT_ALIASES = {
  name: "firstName",
  contactNumber: "phone",
};

const mapDriverResponse = (driver) => {
  if (!driver) return driver;
  const firstName = driver.firstName || "";
  const lastName = driver.lastName || "";
  return {
    ...driver,
    name: [firstName, lastName].filter(Boolean).join(" ").trim() || null,
    contactNumber: driver.phone || null,
  };
};

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
  const safeSortBy = resolveSortBy(sortBy, {
    allowed: DRIVER_SORT_FIELDS,
    aliases: DRIVER_SORT_ALIASES,
    fallback: "createdAt",
  });
  const safeSortOrder = resolveSortOrder(sortOrder);

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
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
    ].filter((clause) => Object.keys(clause).length > 0),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [safeSortBy]: safeSortOrder },
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
    items: items.map(mapDriverResponse),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / safeLimit),
    },
  };
};

const getDriverById = async (id) => {
  const driver = await prisma.driver.findFirst({ where: { id, isDeleted: false },
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

  return mapDriverResponse(driver);
};

const createDriver = async (data, userId, meta = {}) => {
  let {
    employeeCode,
    firstName,
    lastName,
    name,
    phone,
    contactNumber,
    email,
    licenseNumber,
    licenseCategory,
    licenseExpiryDate,
    joiningDate,
    address,
    safetyScore,
    status,
  } = data;

  phone = phone || contactNumber;
  if ((!firstName || !lastName) && name) {
    const split = splitFullName(name);
    firstName = firstName || split.firstName;
    lastName = lastName || split.lastName;
  }

  if (!firstName || !lastName) {
    throw new AppError(400, "Driver name is required");
  }
  if (!phone) {
    throw new AppError(400, "Phone number is required");
  }
  if (!licenseNumber || !licenseCategory || !licenseExpiryDate) {
    throw new AppError(400, "License details are required");
  }

  if (!employeeCode) {
    employeeCode = `DRV-${Date.now().toString(36).toUpperCase()}`;
  }

  if (!email) {
    email = `${employeeCode.toLowerCase()}@drivers.transitops.local`;
  }

  if (!joiningDate) {
    joiningDate = new Date().toISOString().slice(0, 10);
  }

  const existingEmployeeCode = await prisma.driver.findUnique({
    where: { employeeCode },
  });

  if (existingEmployeeCode) {
    throw new AppError(400, "Employee code already exists");
  }

  const existingPhone = await prisma.driver.findFirst({
    where: { phone, isDeleted: false },
  });

  if (existingPhone) {
    throw new AppError(400, "Phone number already exists");
  }

  if (email) {
    const existingEmail = await prisma.driver.findFirst({
      where: { email, isDeleted: false },
    });

    if (existingEmail) {
      throw new AppError(400, "Email already exists");
    }
  }

  const existingLicense = await prisma.driver.findFirst({
    where: { licenseNumber, isDeleted: false },
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

  const initialStatus = status || "AVAILABLE";
  if (!["AVAILABLE", "OFF_DUTY", "SUSPENDED"].includes(initialStatus)) {
    throw new AppError(400, "Invalid status");
  }

  const driver = await prisma.driver.create({
    data: {
      employeeCode,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      licenseNumber: String(licenseNumber).trim().toUpperCase(),
      licenseCategory,
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      address: address || null,
      safetyScore: safetyScore ?? 100,
      status: initialStatus,
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

  const mapped = mapDriverResponse(serializeValue(driver));

  emitDomainEvent("driver.created", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { driver: mapped },
    dashboardChanges: {
      availableDrivers: mapped.status === "AVAILABLE" ? 1 : 0,
    },
  });

  return mapped;
};

const updateDriver = async (id, data, userId, meta = {}) => {
  const driver = await prisma.driver.findFirst({ where: { id, isDeleted: false },
  });

  if (!driver) {
    throw new AppError(404, "Driver not found");
  }

  const patch = { ...data };
  if (patch.contactNumber && !patch.phone) {
    patch.phone = patch.contactNumber;
  }
  delete patch.contactNumber;

  if (patch.name && (!patch.firstName || !patch.lastName)) {
    const split = splitFullName(patch.name);
    patch.firstName = patch.firstName || split.firstName;
    patch.lastName = patch.lastName || split.lastName;
  }
  delete patch.name;

  if (patch.employeeCode && patch.employeeCode !== driver.employeeCode) {
    const existingEmployeeCode = await prisma.driver.findUnique({
      where: { employeeCode: patch.employeeCode },
    });

    if (existingEmployeeCode) {
      throw new AppError(400, "Employee code already exists");
    }
  }

  if (patch.phone && patch.phone !== driver.phone) {
    const existingPhone = await prisma.driver.findFirst({
      where: { phone: patch.phone, isDeleted: false, NOT: { id } },
    });

    if (existingPhone) {
      throw new AppError(400, "Phone number already exists");
    }
  }

  if (patch.email && patch.email !== driver.email) {
    const existingEmail = await prisma.driver.findFirst({
      where: { email: patch.email, isDeleted: false, NOT: { id } },
    });

    if (existingEmail) {
      throw new AppError(400, "Email already exists");
    }
  }

  if (patch.licenseNumber && patch.licenseNumber !== driver.licenseNumber) {
    if (driver.status === "ON_TRIP") {
      throw new AppError(400, "Cannot edit license number while driver is on trip");
    }

    const existingLicense = await prisma.driver.findFirst({
      where: { licenseNumber: patch.licenseNumber, isDeleted: false, NOT: { id } },
    });

    if (existingLicense) {
      throw new AppError(400, "License number already exists");
    }
  }

  if (patch.licenseExpiryDate && new Date(patch.licenseExpiryDate) <= new Date()) {
    throw new AppError(400, "License expiry date must be in the future");
  }

  if (patch.safetyScore !== undefined && (patch.safetyScore < 0 || patch.safetyScore > 100)) {
    throw new AppError(400, "Safety score must be between 0 and 100");
  }

  const oldValue = { ...driver };
  delete oldValue.id;

  const updatedDriver = await prisma.driver.update({
    where: { id },
    data: {
      ...patch,
      licenseExpiryDate: patch.licenseExpiryDate
        ? new Date(patch.licenseExpiryDate)
        : undefined,
      joiningDate: patch.joiningDate ? new Date(patch.joiningDate) : undefined,
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

  const mapped = mapDriverResponse(serializeValue(updatedDriver));

  emitDomainEvent("driver.updated", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { driver: mapped },
  });

  return mapped;
};

const changeDriverStatus = async (id, status, userId, meta = {}) => {
  const driver = await prisma.driver.findFirst({ where: { id, isDeleted: false },
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

  const serialized = mapDriverResponse(serializeValue(updatedDriver));

  emitDomainEvent("driver.status_changed", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: {
      driver: serialized,
      status: updatedDriver.status,
    },
    dashboardChanges: {
      availableDrivers:
        updatedDriver.status === "AVAILABLE"
          ? 1
          : oldValue.status === "AVAILABLE"
            ? -1
            : 0,
      suspendedDrivers:
        updatedDriver.status === "SUSPENDED"
          ? 1
          : oldValue.status === "SUSPENDED"
            ? -1
            : 0,
    },
  });

  return serialized;
};

const deleteDriver = async (id, userId, meta = {}) => {
  const driver = await prisma.driver.findFirst({ where: { id, isDeleted: false },
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

  emitDomainEvent("driver.deleted", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { driver: serializeValue({ ...driver, isDeleted: true }) },
    dashboardChanges: {
      availableDrivers: driver.status === "AVAILABLE" ? -1 : 0,
    },
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
