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

const EXPENSE_SORT_FIELDS = new Set([
  "category",
  "title",
  "amount",
  "expenseDate",
  "vendor",
  "paymentMethod",
  "createdAt",
  "updatedAt",
]);

const getExpenses = async ({
  page = 1,
  limit = 10,
  category,
  vehicleId,
  tripId,
  fromDate,
  toDate,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;
  const safeSortBy = resolveSortBy(sortBy, {
    allowed: EXPENSE_SORT_FIELDS,
    fallback: "createdAt",
  });
  const safeSortOrder = resolveSortOrder(sortOrder);

  const where = {
    AND: [
      { isDeleted: false },
      category ? { category } : {},
      vehicleId ? { vehicleId } : {},
      tripId ? { tripId } : {},
      fromDate || toDate
        ? {
            expenseDate: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {},
    ].filter((clause) => Object.keys(clause).length > 0),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [safeSortBy]: safeSortOrder },
      select: {
        id: true,
        vehicleId: true,
        driverId: true,
        tripId: true,
        category: true,
        title: true,
        amount: true,
        expenseDate: true,
        vendor: true,
        paymentMethod: true,
        receiptUrl: true,
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
    prisma.expense.count({ where }),
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

const getExpenseById = async (id) => {
  const expense = await prisma.expense.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      vehicleId: true,
      driverId: true,
      tripId: true,
      category: true,
      title: true,
      amount: true,
      expenseDate: true,
      vendor: true,
      paymentMethod: true,
      receiptUrl: true,
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

  if (!expense) {
    throw new AppError(404, "Expense not found");
  }

  return expense;
};

const createExpense = async (data, userId, meta = {}) => {
  const {
    vehicleId,
    driverId,
    tripId,
    category,
    title,
    amount,
    expenseDate,
    vendor,
    paymentMethod,
    receiptUrl,
    remarks,
  } = data;

  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId, isDeleted: false },
    });

    if (!vehicle) {
      throw new AppError(404, "Vehicle not found");
    }
  }

  if (driverId) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId, isDeleted: false },
    });

    if (!driver) {
      throw new AppError(404, "Driver not found");
    }
  }

  if (tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new AppError(404, "Trip not found");
    }
  }

  if (amount <= 0) {
    throw new AppError(400, "Amount must be greater than 0");
  }

  const expense = await prisma.expense.create({
    data: {
      vehicleId,
      driverId,
      tripId,
      category,
      title,
      amount,
      expenseDate: new Date(expenseDate),
      vendor,
      paymentMethod,
      receiptUrl,
      remarks,
      createdBy: userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "EXPENSE",
      action: "CREATE",
      recordId: expense.id,
      newValue: expense,
    },
  });

  emitDomainEvent("expense.created", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { expense: serializeValue(expense) },
    dashboardChanges: {
      expenses: Number(amount) || 0,
      totalOperationalCost: Number(amount) || 0,
    },
  });

  return serializeValue(expense);
};

const updateExpense = async (id, data, userId, meta = {}) => {
  const expense = await prisma.expense.findUnique({
    where: { id, isDeleted: false },
  });

  if (!expense) {
    throw new AppError(404, "Expense not found");
  }

  if (data.amount !== undefined && data.amount <= 0) {
    throw new AppError(400, "Amount must be greater than 0");
  }

  const oldValue = { ...expense };
  delete oldValue.id;

  const updatedExpense = await prisma.expense.update({
    where: { id },
    data: {
      ...data,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "EXPENSE",
      action: "UPDATE",
      recordId: expense.id,
      oldValue,
      newValue: updatedExpense,
    },
  });

  emitDomainEvent("expense.updated", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { expense: serializeValue(updatedExpense) },
  });

  return serializeValue(updatedExpense);
};

const deleteExpense = async (id, userId, meta = {}) => {
  const expense = await prisma.expense.findUnique({
    where: { id, isDeleted: false },
  });

  if (!expense) {
    throw new AppError(404, "Expense not found");
  }

  const oldValue = { ...expense };
  delete oldValue.id;

  await prisma.expense.update({
    where: { id },
    data: { isDeleted: true },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "EXPENSE",
      action: "DELETE",
      recordId: expense.id,
      oldValue,
    },
  });

  emitDomainEvent("expense.deleted", {
    actorUserId: userId,
    excludeSocketId: meta.socketId,
    data: { id: expense.id, expense: serializeValue({ ...expense, isDeleted: true }) },
  });

  return { message: "Expense archived successfully" };
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
