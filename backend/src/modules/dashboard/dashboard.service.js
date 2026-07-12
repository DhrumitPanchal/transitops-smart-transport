const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getDashboardSummary = async () => {
  const [
    totalVehicles,
    availableVehicles,
    onTripVehicles,
    maintenanceVehicles,
    totalDrivers,
    availableDrivers,
    activeTrips,
    completedTrips,
    cancelledTrips,
    totalExpenses,
    totalFuelCost,
    maintenanceCost,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { isDeleted: false } }),
    prisma.vehicle.count({ where: { isDeleted: false, status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { isDeleted: false, status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { isDeleted: false, status: "IN_SHOP" } }),
    prisma.driver.count({ where: { isDeleted: false } }),
    prisma.driver.count({ where: { isDeleted: false, status: "AVAILABLE" } }),
    prisma.trip.count({ where: { status: { in: ["DISPATCHED", "IN_PROGRESS"] } } }),
    prisma.trip.count({ where: { status: "COMPLETED" } }),
    prisma.trip.count({ where: { status: "CANCELLED" } }),
    prisma.expense.aggregate({
      where: { isDeleted: false },
      _sum: { amount: true },
    }),
    prisma.vehicleFuelLog.aggregate({
      where: { isDeleted: false },
      _sum: { totalAmount: true },
    }),
    prisma.vehicleMaintenance.aggregate({
      where: { isDeleted: false, status: "COMPLETED" },
      _sum: { actualCost: true },
    }),
  ]);

  return {
    totalVehicles,
    availableVehicles,
    onTripVehicles,
    maintenanceVehicles,
    totalDrivers,
    availableDrivers,
    activeTrips,
    completedTrips,
    cancelledTrips,
    totalExpenses: totalExpenses._sum.amount || 0,
    totalFuelCost: totalFuelCost._sum.totalAmount || 0,
    maintenanceCost: maintenanceCost._sum.actualCost || 0,
  };
};

const getVehicleStatusSummary = async () => {
  const [available, onTrip, inShop, retired] = await Promise.all([
    prisma.vehicle.count({ where: { isDeleted: false, status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { isDeleted: false, status: "ON_TRIP" } }),
    prisma.vehicle.count({ where: { isDeleted: false, status: "IN_SHOP" } }),
    prisma.vehicle.count({ where: { isDeleted: false, status: "RETIRED" } }),
  ]);

  return {
    available,
    onTrip,
    inShop,
    retired,
  };
};

const getDriverStatusSummary = async () => {
  const [available, onTrip, offDuty, suspended] = await Promise.all([
    prisma.driver.count({ where: { isDeleted: false, status: "AVAILABLE" } }),
    prisma.driver.count({ where: { isDeleted: false, status: "ON_TRIP" } }),
    prisma.driver.count({ where: { isDeleted: false, status: "OFF_DUTY" } }),
    prisma.driver.count({ where: { isDeleted: false, status: "SUSPENDED" } }),
  ]);

  return {
    available,
    onTrip,
    offDuty,
    suspended,
  };
};

const getActiveTrips = async () => {
  const trips = await prisma.trip.findMany({
    where: { status: { in: ["DISPATCHED", "IN_PROGRESS"] } },
    select: {
      id: true,
      tripNumber: true,
      source: true,
      destination: true,
      status: true,
      actualStart: true,
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          vehicleName: true,
        },
      },
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { actualStart: "desc" },
    take: 20,
  });

  return trips;
};

const getUpcomingMaintenance = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const maintenances = await prisma.vehicleMaintenance.findMany({
    where: {
      isDeleted: false,
      status: "SCHEDULED",
      scheduledDate: { gte: today, lte: nextWeek },
    },
    select: {
      id: true,
      maintenanceType: true,
      scheduledDate: true,
      estimatedCost: true,
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          vehicleName: true,
        },
      },
    },
    orderBy: { scheduledDate: "asc" },
    take: 10,
  });

  return maintenances;
};

const getFuelSummary = async ({ fromDate, toDate }) => {
  const where = {
    isDeleted: false,
    ...(fromDate && { fuelDate: { gte: new Date(fromDate) } }),
    ...(toDate && { fuelDate: { lte: new Date(toDate) } }),
  };

  const [totalCost, totalQuantity, fuelLogs] = await Promise.all([
    prisma.vehicleFuelLog.aggregate({
      where,
      _sum: { totalAmount: true, quantity: true },
    }),
    prisma.vehicleFuelLog.aggregate({
      where,
      _sum: { totalAmount: true },
      _max: { totalAmount: true },
    }),
    prisma.vehicleFuelLog.findMany({
      where,
      select: {
        quantity: true,
        totalAmount: true,
        odometerReading: true,
      },
    }),
  ]);

  let averageMileage = 0;
  if (fuelLogs.length > 1) {
    const totalDistance = fuelLogs[fuelLogs.length - 1].odometerReading - fuelLogs[0].odometerReading;
    const totalFuel = totalQuantity._sum.quantity || 0;
    if (totalDistance > 0 && totalFuel > 0) {
      averageMileage = totalDistance / totalFuel;
    }
  }

  return {
    totalFuelCost: totalCost._sum.totalAmount || 0,
    totalFuelQuantity: totalQuantity._sum.quantity || 0,
    averageMileage,
    highestFuelExpense: totalCost._max.totalAmount || 0,
  };
};

const getExpenseSummary = async ({ fromDate, toDate }) => {
  const where = {
    isDeleted: false,
    ...(fromDate && { expenseDate: { gte: new Date(fromDate) } }),
    ...(toDate && { expenseDate: { lte: new Date(toDate) } }),
  };

  const [totalExpenses, expensesByCategory, highestExpense] = await Promise.all([
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: { amount: true },
    }),
    prisma.expense.findFirst({
      where,
      orderBy: { amount: "desc" },
      select: { amount: true, title: true, category: true },
    }),
  ]);

  const categoryExpenses = expensesByCategory.map((item) => ({
    category: item.category,
    amount: item._sum.amount || 0,
  }));

  return {
    totalExpenses: totalExpenses._sum.amount || 0,
    expensesByCategory: categoryExpenses,
    highestExpense,
  };
};

const getRecentActivities = async () => {
  const recentTrips = await prisma.trip.findMany({
    where: { status: { in: ["COMPLETED", "CANCELLED"] } },
    select: {
      id: true,
      tripNumber: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const recentVehicles = await prisma.vehicle.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      registrationNumber: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const recentDrivers = await prisma.driver.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const recentMaintenance = await prisma.vehicleMaintenance.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      maintenanceType: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return {
    recentTrips,
    recentVehicles,
    recentDrivers,
    recentMaintenance,
  };
};

module.exports = {
  getDashboardSummary,
  getVehicleStatusSummary,
  getDriverStatusSummary,
  getActiveTrips,
  getUpcomingMaintenance,
  getFuelSummary,
  getExpenseSummary,
  getRecentActivities,
};
