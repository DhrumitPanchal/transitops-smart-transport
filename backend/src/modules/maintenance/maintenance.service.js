const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const AppError = require("../../common/AppError");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const generateMaintenanceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MNT-${timestamp}-${random}`;
};

const getMaintenances = async ({
  page = 1,
  limit = 10,
  vehicleId,
  type,
  status,
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
      type ? { maintenanceType: type } : {},
      status ? { status } : {},
      fromDate || toDate
        ? {
            scheduledDate: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {},
    ].filter(Boolean),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.vehicleMaintenance.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        maintenanceNumber: true,
        vehicleId: true,
        maintenanceType: true,
        title: true,
        description: true,
        serviceCenter: true,
        scheduledDate: true,
        completedDate: true,
        estimatedCost: true,
        actualCost: true,
        currentOdometer: true,
        nextServiceOdometer: true,
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
      },
    }),
    prisma.vehicleMaintenance.count({ where }),
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

const getMaintenanceById = async (id) => {
  const maintenance = await prisma.vehicleMaintenance.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      maintenanceNumber: true,
      vehicleId: true,
      maintenanceType: true,
      title: true,
      description: true,
      serviceCenter: true,
      scheduledDate: true,
      completedDate: true,
      estimatedCost: true,
      actualCost: true,
      currentOdometer: true,
      nextServiceOdometer: true,
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
    },
  });

  if (!maintenance) {
    throw new AppError(404, "Maintenance not found");
  }

  return maintenance;
};

const createMaintenance = async (data, userId) => {
  const {
    vehicleId,
    maintenanceType,
    title,
    description,
    serviceCenter,
    scheduledDate,
    estimatedCost,
    currentOdometer,
    nextServiceOdometer,
    remarks,
  } = data;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId, isDeleted: false },
  });

  if (!vehicle) {
    throw new AppError(404, "Vehicle not found");
  }

  const activeMaintenance = await prisma.vehicleMaintenance.findFirst({
    where: {
      vehicleId,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      isDeleted: false,
    },
  });

  if (activeMaintenance) {
    throw new AppError(400, "Vehicle already has active maintenance");
  }

  if (new Date(scheduledDate) < new Date().setHours(0, 0, 0, 0)) {
    throw new AppError(400, "Scheduled date cannot be in the past");
  }

  if (estimatedCost !== undefined && estimatedCost < 0) {
    throw new AppError(400, "Estimated cost cannot be negative");
  }

  if (currentOdometer < 0) {
    throw new AppError(400, "Current odometer cannot be negative");
  }

  const maintenanceNumber = generateMaintenanceNumber();

  const maintenance = await prisma.vehicleMaintenance.create({
    data: {
      maintenanceNumber,
      vehicleId,
      maintenanceType,
      title,
      description,
      serviceCenter,
      scheduledDate: new Date(scheduledDate),
      estimatedCost,
      currentOdometer,
      nextServiceOdometer,
      remarks,
      status: "SCHEDULED",
      createdBy: userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "MAINTENANCE",
      action: "CREATE",
      recordId: maintenance.id,
      newValue: maintenance,
    },
  });

  return maintenance;
};

const updateMaintenance = async (id, data, userId) => {
  const maintenance = await prisma.vehicleMaintenance.findUnique({
    where: { id, isDeleted: false },
  });

  if (!maintenance) {
    throw new AppError(404, "Maintenance not found");
  }

  if (maintenance.status === "COMPLETED") {
    throw new AppError(400, "Cannot update completed maintenance");
  }

  if (maintenance.status === "CANCELLED") {
    throw new AppError(400, "Cannot update cancelled maintenance");
  }

  if (data.vehicleId && data.vehicleId !== maintenance.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId, isDeleted: false },
    });

    if (!vehicle) {
      throw new AppError(404, "Vehicle not found");
    }

    const activeMaintenance = await prisma.vehicleMaintenance.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        isDeleted: false,
        id: { not: id },
      },
    });

    if (activeMaintenance) {
      throw new AppError(400, "Vehicle already has active maintenance");
    }
  }

  if (data.scheduledDate && new Date(data.scheduledDate) < new Date().setHours(0, 0, 0, 0)) {
    throw new AppError(400, "Scheduled date cannot be in the past");
  }

  if (data.estimatedCost !== undefined && data.estimatedCost < 0) {
    throw new AppError(400, "Estimated cost cannot be negative");
  }

  const oldValue = { ...maintenance };
  delete oldValue.id;

  const updatedMaintenance = await prisma.vehicleMaintenance.update({
    where: { id },
    data: {
      ...data,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "MAINTENANCE",
      action: "UPDATE",
      recordId: maintenance.id,
      oldValue,
      newValue: updatedMaintenance,
    },
  });

  return updatedMaintenance;
};

const startMaintenance = async (id, userId) => {
  const maintenance = await prisma.vehicleMaintenance.findUnique({
    where: { id, isDeleted: false },
    include: { vehicle: true },
  });

  if (!maintenance) {
    throw new AppError(404, "Maintenance not found");
  }

  if (maintenance.status !== "SCHEDULED") {
    throw new AppError(400, "Maintenance must be in SCHEDULED status to start");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedMaintenance = await tx.vehicleMaintenance.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });

    await tx.vehicle.update({
      where: { id: maintenance.vehicleId },
      data: { status: "IN_SHOP" },
    });

    await tx.auditLog.create({
      data: {
        userId,
        module: "MAINTENANCE",
        action: "START",
        recordId: maintenance.id,
        oldValue: { status: "SCHEDULED" },
        newValue: { status: "IN_PROGRESS" },
      },
    });

    return updatedMaintenance;
  });

  return result;
};

const completeMaintenance = async (id, data, userId) => {
  const maintenance = await prisma.vehicleMaintenance.findUnique({
    where: { id, isDeleted: false },
    include: { vehicle: true },
  });

  if (!maintenance) {
    throw new AppError(404, "Maintenance not found");
  }

  if (maintenance.status !== "IN_PROGRESS") {
    throw new AppError(400, "Maintenance must be in IN_PROGRESS status to complete");
  }

  const { actualCost, completedDate, nextServiceOdometer, remarks } = data;

  if (actualCost < 0) {
    throw new AppError(400, "Actual cost cannot be negative");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedMaintenance = await tx.vehicleMaintenance.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actualCost,
        completedDate: new Date(completedDate),
        nextServiceOdometer,
        remarks: remarks || maintenance.remarks,
      },
    });

    await tx.vehicle.update({
      where: { id: maintenance.vehicleId },
      data: { status: "AVAILABLE" },
    });

    await tx.auditLog.create({
      data: {
        userId,
        module: "MAINTENANCE",
        action: "COMPLETE",
        recordId: maintenance.id,
        oldValue: { status: "IN_PROGRESS" },
        newValue: { status: "COMPLETED", actualCost, completedDate },
      },
    });

    return updatedMaintenance;
  });

  return result;
};

const cancelMaintenance = async (id, data, userId) => {
  const maintenance = await prisma.vehicleMaintenance.findUnique({
    where: { id, isDeleted: false },
    include: { vehicle: true },
  });

  if (!maintenance) {
    throw new AppError(404, "Maintenance not found");
  }

  if (maintenance.status !== "SCHEDULED") {
    throw new AppError(400, "Only SCHEDULED maintenance can be cancelled");
  }

  const { reason } = data;

  const result = await prisma.$transaction(async (tx) => {
    const updatedMaintenance = await tx.vehicleMaintenance.update({
      where: { id },
      data: {
        status: "CANCELLED",
        remarks: reason,
      },
    });

    if (maintenance.vehicle.status === "IN_SHOP") {
      await tx.vehicle.update({
        where: { id: maintenance.vehicleId },
        data: { status: "AVAILABLE" },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        module: "MAINTENANCE",
        action: "CANCEL",
        recordId: maintenance.id,
        oldValue: { status: "SCHEDULED" },
        newValue: { status: "CANCELLED", reason },
      },
    });

    return updatedMaintenance;
  });

  return result;
};

const deleteMaintenance = async (id, userId) => {
  const maintenance = await prisma.vehicleMaintenance.findUnique({
    where: { id, isDeleted: false },
  });

  if (!maintenance) {
    throw new AppError(404, "Maintenance not found");
  }

  if (maintenance.status === "IN_PROGRESS") {
    throw new AppError(400, "Cannot delete maintenance that is in progress");
  }

  const oldValue = { ...maintenance };
  delete oldValue.id;

  await prisma.vehicleMaintenance.update({
    where: { id },
    data: { isDeleted: true },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "MAINTENANCE",
      action: "DELETE",
      recordId: maintenance.id,
      oldValue,
    },
  });

  return { message: "Maintenance archived successfully" };
};

module.exports = {
  getMaintenances,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
  deleteMaintenance,
};
