const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getTripReport = async ({ fromDate, toDate, vehicleId, driverId, status }) => {
  const where = {
    ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
    ...(toDate && { createdAt: { lte: new Date(toDate) } }),
    ...(vehicleId && { vehicleId }),
    ...(driverId && { driverId }),
    ...(status && { status }),
  };

  const [totalTrips, completedTrips, cancelledTrips, activeTrips, trips] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.trip.count({ where: { ...where, status: "CANCELLED" } }),
    prisma.trip.count({ where: { ...where, status: { in: ["DISPATCHED", "IN_PROGRESS"] } } }),
    prisma.trip.findMany({
      where,
      select: {
        id: true,
        tripNumber: true,
        status: true,
        distance: true,
        plannedStart: true,
        plannedEnd: true,
        actualStart: true,
        actualEnd: true,
        createdAt: true,
      },
    }),
  ]);

  let averageDistance = 0;
  let averageDuration = 0;

  const completedTripsData = trips.filter((t) => t.status === "COMPLETED");
  if (completedTripsData.length > 0) {
    const totalDistance = completedTripsData.reduce((sum, t) => sum + (Number(t.distance) || 0), 0);
    averageDistance = totalDistance / completedTripsData.length;

    const totalDuration = completedTripsData.reduce((sum, t) => {
      if (t.actualStart && t.actualEnd) {
        return sum + (new Date(t.actualEnd) - new Date(t.actualStart)) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);
    averageDuration = totalDuration / completedTripsData.length;
  }

  return {
    totalTrips,
    completedTrips,
    cancelledTrips,
    activeTrips,
    averageDistance,
    averageDuration,
    trips,
  };
};

const getVehicleReport = async ({ fromDate, toDate, vehicleId }) => {
  const where = {
    isDeleted: false,
    ...(vehicleId && { id: vehicleId }),
  };

  const vehicles = await prisma.vehicle.findMany({
    where,
    select: {
      id: true,
      registrationNumber: true,
      vehicleName: true,
      vehicleType: true,
      status: true,
      currentOdometer: true,
      trips: {
        where: {
          ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
          ...(toDate && { createdAt: { lte: new Date(toDate) } }),
          status: "COMPLETED",
        },
        select: {
          distance: true,
          startOdometer: true,
          finalOdometer: true,
        },
      },
      fuelLogs: {
        where: {
          isDeleted: false,
          ...(fromDate && { fuelDate: { gte: new Date(fromDate) } }),
          ...(toDate && { fuelDate: { lte: new Date(toDate) } }),
        },
        select: {
          quantity: true,
          totalAmount: true,
        },
      },
      maintenances: {
        where: {
          isDeleted: false,
          status: "COMPLETED",
          ...(fromDate && { completedDate: { gte: new Date(fromDate) } }),
          ...(toDate && { completedDate: { lte: new Date(toDate) } }),
        },
        select: {
          actualCost: true,
        },
      },
    },
  });

  const report = vehicles.map((vehicle) => {
    const tripCount = vehicle.trips.length;
    const distanceCovered = vehicle.trips.reduce((sum, t) => sum + (Number(t.distance) || 0), 0);
    const fuelConsumption = vehicle.fuelLogs.reduce((sum, f) => sum + (Number(f.quantity) || 0), 0);
    const fuelCost = vehicle.fuelLogs.reduce((sum, f) => sum + (Number(f.totalAmount) || 0), 0);
    const maintenanceCost = vehicle.maintenances.reduce((sum, m) => sum + (Number(m.actualCost) || 0), 0);

    return {
      vehicleId: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      vehicleName: vehicle.vehicleName,
      vehicleType: vehicle.vehicleType,
      status: vehicle.status,
      tripCount,
      distanceCovered,
      fuelConsumption,
      fuelCost,
      maintenanceCost,
    };
  });

  return report;
};

const getDriverReport = async ({ fromDate, toDate, driverId }) => {
  const where = {
    isDeleted: false,
    ...(driverId && { id: driverId }),
  };

  const drivers = await prisma.driver.findMany({
    where,
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      status: true,
      safetyScore: true,
      trips: {
        where: {
          ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
          ...(toDate && { createdAt: { lte: new Date(toDate) } }),
          status: "COMPLETED",
        },
        select: {
          distance: true,
          plannedStart: true,
          plannedEnd: true,
          actualStart: true,
          actualEnd: true,
        },
      },
    },
  });

  const report = drivers.map((driver) => {
    const tripsCompleted = driver.trips.length;
    const distanceCovered = driver.trips.reduce((sum, t) => sum + (Number(t.distance) || 0), 0);
    
    let fuelEfficiency = 0;
    let workingHours = 0;

    if (driver.trips.length > 0) {
      const totalDuration = driver.trips.reduce((sum, t) => {
        if (t.actualStart && t.actualEnd) {
          return sum + (new Date(t.actualEnd) - new Date(t.actualStart)) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);
      workingHours = totalDuration;
      fuelEfficiency = distanceCovered > 0 ? distanceCovered / workingHours : 0;
    }

    return {
      driverId: driver.id,
      employeeCode: driver.employeeCode,
      firstName: driver.firstName,
      lastName: driver.lastName,
      status: driver.status,
      safetyScore: driver.safetyScore,
      tripsCompleted,
      distanceCovered,
      fuelEfficiency,
      workingHours,
    };
  });

  return report;
};

const getMaintenanceReport = async ({ fromDate, toDate, vehicleId }) => {
  const where = {
    isDeleted: false,
    status: "COMPLETED",
    ...(fromDate && { completedDate: { gte: new Date(fromDate) } }),
    ...(toDate && { completedDate: { lte: new Date(toDate) } }),
    ...(vehicleId && { vehicleId }),
  };

  const maintenances = await prisma.vehicleMaintenance.findMany({
    where,
    select: {
      id: true,
      maintenanceType: true,
      title: true,
      actualCost: true,
      serviceCenter: true,
      scheduledDate: true,
      completedDate: true,
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          vehicleName: true,
        },
      },
    },
    orderBy: { completedDate: "desc" },
  });

  const report = maintenances.map((m) => {
    let downtime = 0;
    if (m.scheduledDate && m.completedDate) {
      downtime = (new Date(m.completedDate) - new Date(m.scheduledDate)) / (1000 * 60 * 60 * 24);
    }

    return {
      maintenanceId: m.id,
      vehicleId: m.vehicle.id,
      registrationNumber: m.vehicle.registrationNumber,
      vehicleName: m.vehicle.vehicleName,
      maintenanceType: m.maintenanceType,
      title: m.title,
      cost: m.actualCost,
      serviceCenter: m.serviceCenter,
      scheduledDate: m.scheduledDate,
      completedDate: m.completedDate,
      downtime,
    };
  });

  return report;
};

const getFuelReport = async ({ fromDate, toDate, vehicleId }) => {
  const where = {
    isDeleted: false,
    ...(fromDate && { fuelDate: { gte: new Date(fromDate) } }),
    ...(toDate && { fuelDate: { lte: new Date(toDate) } }),
    ...(vehicleId && { vehicleId }),
  };

  const [fuelLogs, summary] = await Promise.all([
    prisma.vehicleFuelLog.findMany({
      where,
      select: {
        id: true,
        fuelDate: true,
        quantity: true,
        totalAmount: true,
        odometerReading: true,
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            vehicleName: true,
          },
        },
      },
      orderBy: { fuelDate: "desc" },
    }),
    prisma.vehicleFuelLog.aggregate({
      where,
      _sum: { quantity: true, totalAmount: true },
    }),
  ]);

  const totalFuelQuantity = summary._sum.quantity || 0;
  const totalFuelCost = summary._sum.totalAmount || 0;
  
  let averageMileage = 0;
  let costPerKm = 0;

  if (fuelLogs.length > 1) {
    const totalDistance = fuelLogs[0].odometerReading - fuelLogs[fuelLogs.length - 1].odometerReading;
    if (totalDistance > 0) {
      averageMileage = totalDistance / totalFuelQuantity;
      costPerKm = totalFuelCost / totalDistance;
    }
  }

  return {
    totalFuelQuantity,
    totalFuelCost,
    averageMileage,
    costPerKm,
    fuelLogs,
  };
};

const getExpenseReport = async ({ fromDate, toDate, vehicleId, category }) => {
  const where = {
    isDeleted: false,
    ...(fromDate && { expenseDate: { gte: new Date(fromDate) } }),
    ...(toDate && { expenseDate: { lte: new Date(toDate) } }),
    ...(vehicleId && { vehicleId }),
    ...(category && { category }),
  };

  const [expenses, categorySummary, vehicleSummary, tripSummary] = await Promise.all([
    prisma.expense.findMany({
      where,
      select: {
        id: true,
        category: true,
        title: true,
        amount: true,
        expenseDate: true,
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            vehicleName: true,
          },
        },
        trip: {
          select: {
            id: true,
            tripNumber: true,
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["vehicleId"],
      where,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["tripId"],
      where: { ...where, tripId: { not: null } },
      _sum: { amount: true },
    }),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    totalExpenses,
    categoryWiseExpenses: categorySummary.map((c) => ({
      category: c.category,
      amount: c._sum.amount || 0,
    })),
    vehicleWiseExpenses: vehicleSummary.map((v) => ({
      vehicleId: v.vehicleId,
      amount: v._sum.amount || 0,
    })),
    tripWiseExpenses: tripSummary.map((t) => ({
      tripId: t.tripId,
      amount: t._sum.amount || 0,
    })),
    expenses,
  };
};

const getFinancialSummary = async ({ fromDate, toDate }) => {
  const where = {
    isDeleted: false,
    ...(fromDate && { expenseDate: { gte: new Date(fromDate) } }),
    ...(toDate && { expenseDate: { lte: new Date(toDate) } }),
  };

  const [fuelCost, maintenanceCost, driverExpenses, otherExpenses, totalExpenses] = await Promise.all([
    prisma.vehicleFuelLog.aggregate({
      where: {
        isDeleted: false,
        ...(fromDate && { fuelDate: { gte: new Date(fromDate) } }),
        ...(toDate && { fuelDate: { lte: new Date(toDate) } }),
      },
      _sum: { totalAmount: true },
    }),
    prisma.vehicleMaintenance.aggregate({
      where: {
        isDeleted: false,
        status: "COMPLETED",
        ...(fromDate && { completedDate: { gte: new Date(fromDate) } }),
        ...(toDate && { completedDate: { lte: new Date(toDate) } }),
      },
      _sum: { actualCost: true },
    }),
    prisma.expense.aggregate({
      where: { ...where, category: "Driver Allowance" },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { ...where, category: { not: "Driver Allowance" } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  return {
    fuelCost: fuelCost._sum.totalAmount || 0,
    maintenanceCost: maintenanceCost._sum.actualCost || 0,
    driverExpenses: driverExpenses._sum.amount || 0,
    otherExpenses: otherExpenses._sum.amount || 0,
    totalOperationalCost: totalExpenses._sum.amount || 0,
  };
};

const toNumber = (value) => Number(value || 0);

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getReportSummary = async (filters = {}) => {
  const fromDate = filters.fromDate || filters.dateFrom || null;
  const toDate = filters.toDate || filters.dateTo || null;
  const vehicleId = filters.vehicleId || null;
  const vehicleType = filters.vehicleType || null;
  const region = filters.region || null;

  const vehicleWhere = {
    isDeleted: false,
    ...(vehicleId ? { id: vehicleId } : {}),
    ...(vehicleType ? { vehicleType } : {}),
    ...(region
      ? { region: { equals: String(region).trim(), mode: "insensitive" } }
      : {}),
  };

  const vehicles = await prisma.vehicle.findMany({
    where: vehicleWhere,
    select: {
      id: true,
      status: true,
      purchaseCost: true,
    },
  });
  const vehicleIds = vehicles.map((item) => item.id);

  // When filters exclude every vehicle, return empty summary.
  if (
    (vehicleId || vehicleType || region) &&
    vehicleIds.length === 0
  ) {
    return {
      metrics: {
        fuelEfficiency: 0,
        fleetUtilization: 0,
        fuelCost: 0,
        maintenanceCost: 0,
        otherExpenses: 0,
        operationalCost: 0,
        revenue: 0,
        vehicleRoi: 0,
      },
      vehicles: {
        total: 0,
        available: 0,
        onTrip: 0,
        inShop: 0,
        retired: 0,
      },
      drivers: {
        total: 0,
        available: 0,
        onTrip: 0,
        offDuty: 0,
        suspended: 0,
      },
      trips: {
        total: 0,
        draft: 0,
        dispatched: 0,
        completed: 0,
        cancelled: 0,
        inProgress: 0,
      },
      maintenance: { open: 0, completed: 0 },
      costs: { fuel: 0, expenses: 0, maintenance: 0 },
      filters,
      generatedAt: new Date().toISOString(),
    };
  }

  const tripDateFilter =
    fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: endOfDay(toDate) } : {}),
          },
        }
      : {};

  const fuelDateFilter =
    fromDate || toDate
      ? {
          fuelDate: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: endOfDay(toDate) } : {}),
          },
        }
      : {};

  const maintenanceDateFilter =
    fromDate || toDate
      ? {
          scheduledDate: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: endOfDay(toDate) } : {}),
          },
        }
      : {};

  const expenseDateFilter =
    fromDate || toDate
      ? {
          expenseDate: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: endOfDay(toDate) } : {}),
          },
        }
      : {};

  const tripWhere = {
    ...(vehicleIds.length ? { vehicleId: { in: vehicleIds } } : {}),
    ...tripDateFilter,
  };

  const [
    tripGroups,
    fuelAgg,
    fuelQtyAgg,
    maintenanceAgg,
    maintenanceOpen,
    maintenanceCompleted,
    expenseAgg,
    drivers,
    completedTrips,
  ] = await Promise.all([
    prisma.trip.groupBy({
      by: ["status"],
      where: tripWhere,
      _count: { _all: true },
    }),
    prisma.vehicleFuelLog.aggregate({
      where: {
        isDeleted: false,
        ...(vehicleIds.length ? { vehicleId: { in: vehicleIds } } : {}),
        ...fuelDateFilter,
      },
      _sum: { totalAmount: true },
    }),
    prisma.vehicleFuelLog.aggregate({
      where: {
        isDeleted: false,
        ...(vehicleIds.length ? { vehicleId: { in: vehicleIds } } : {}),
        ...fuelDateFilter,
      },
      _sum: { quantity: true },
    }),
    prisma.vehicleMaintenance.aggregate({
      where: {
        isDeleted: false,
        status: "COMPLETED",
        ...(vehicleIds.length ? { vehicleId: { in: vehicleIds } } : {}),
        ...maintenanceDateFilter,
      },
      _sum: { actualCost: true },
    }),
    prisma.vehicleMaintenance.count({
      where: {
        isDeleted: false,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        ...(vehicleIds.length ? { vehicleId: { in: vehicleIds } } : {}),
        ...maintenanceDateFilter,
      },
    }),
    prisma.vehicleMaintenance.count({
      where: {
        isDeleted: false,
        status: "COMPLETED",
        ...(vehicleIds.length ? { vehicleId: { in: vehicleIds } } : {}),
        ...maintenanceDateFilter,
      },
    }),
    prisma.expense.aggregate({
      where: {
        isDeleted: false,
        ...(vehicleIds.length
          ? {
              OR: [
                { vehicleId: { in: vehicleIds } },
                { vehicleId: null },
              ],
            }
          : {}),
        ...expenseDateFilter,
      },
      _sum: { amount: true },
    }),
    prisma.driver.findMany({
      where: { isDeleted: false },
      select: { status: true },
    }),
    prisma.trip.findMany({
      where: { ...tripWhere, status: "COMPLETED" },
      select: {
        distance: true,
        startOdometer: true,
        finalOdometer: true,
        fuelConsumed: true,
      },
    }),
  ]);

  const tripCounts = tripGroups.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all;
      acc.total += row._count._all;
      return acc;
    },
    {
      total: 0,
      DRAFT: 0,
      DISPATCHED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    },
  );

  const fuelCost = toNumber(fuelAgg._sum.totalAmount);
  const maintenanceCost = toNumber(maintenanceAgg._sum.actualCost);
  const otherExpenses = toNumber(expenseAgg._sum.amount);
  const operationalCost = fuelCost + maintenanceCost + otherExpenses;

  // Schema has no trip.revenue yet — keep 0 until that field exists.
  const revenue = 0;
  const acquisitionCost = vehicles
    .filter((item) => item.status !== "RETIRED")
    .reduce((sum, item) => sum + toNumber(item.purchaseCost), 0);
  const net = revenue - operationalCost;
  const vehicleRoi =
    acquisitionCost > 0
      ? Math.round((net / acquisitionCost) * 10000) / 100
      : 0;

  const totalLiters = toNumber(fuelQtyAgg._sum.quantity);
  const totalDistance = completedTrips.reduce((sum, trip) => {
    if (trip.finalOdometer != null && trip.startOdometer != null) {
      return sum + (toNumber(trip.finalOdometer) - toNumber(trip.startOdometer));
    }
    return sum + toNumber(trip.distance);
  }, 0);
  const fuelEfficiency =
    totalLiters > 0
      ? Math.round((totalDistance / totalLiters) * 100) / 100
      : 0;

  const activeVehicles = vehicles.filter((item) => item.status !== "RETIRED");
  const onTripVehicles = vehicles.filter((item) => item.status === "ON_TRIP").length;
  const fleetUtilization =
    activeVehicles.length > 0
      ? Math.round((onTripVehicles / activeVehicles.length) * 10000) / 100
      : 0;

  const countByStatus = (list, status) =>
    list.filter((item) => item.status === status).length;

  return {
    metrics: {
      fuelEfficiency,
      fleetUtilization,
      fuelCost,
      maintenanceCost,
      otherExpenses,
      operationalCost,
      revenue,
      vehicleRoi,
    },
    vehicles: {
      total: vehicles.length,
      available: countByStatus(vehicles, "AVAILABLE"),
      onTrip: countByStatus(vehicles, "ON_TRIP"),
      inShop: countByStatus(vehicles, "IN_SHOP"),
      retired: countByStatus(vehicles, "RETIRED"),
    },
    drivers: {
      total: drivers.length,
      available: countByStatus(drivers, "AVAILABLE"),
      onTrip: countByStatus(drivers, "ON_TRIP"),
      offDuty: countByStatus(drivers, "OFF_DUTY"),
      suspended: countByStatus(drivers, "SUSPENDED"),
    },
    trips: {
      total: tripCounts.total,
      draft: tripCounts.DRAFT,
      dispatched: tripCounts.DISPATCHED,
      inProgress: tripCounts.IN_PROGRESS,
      completed: tripCounts.COMPLETED,
      cancelled: tripCounts.CANCELLED,
    },
    maintenance: {
      open: maintenanceOpen,
      completed: maintenanceCompleted,
    },
    costs: {
      fuel: fuelCost,
      expenses: otherExpenses,
      maintenance: maintenanceCost,
    },
    filters,
    generatedAt: new Date().toISOString(),
  };
};

const exportReportCsv = async (filters = {}) => {
  const summary = await getReportSummary(filters);
  const rows = [
    ["Section", "Metric", "Value"],
    ["Metrics", "Fuel Efficiency (km/L)", summary.metrics.fuelEfficiency],
    ["Metrics", "Fleet Utilization (%)", summary.metrics.fleetUtilization],
    ["Metrics", "Fuel Cost", summary.metrics.fuelCost],
    ["Metrics", "Maintenance Cost", summary.metrics.maintenanceCost],
    ["Metrics", "Other Expenses", summary.metrics.otherExpenses],
    ["Metrics", "Operational Cost", summary.metrics.operationalCost],
    ["Metrics", "Revenue", summary.metrics.revenue],
    ["Metrics", "Vehicle ROI (%)", summary.metrics.vehicleRoi],
    ["Vehicles", "Total", summary.vehicles.total],
    ["Vehicles", "Available", summary.vehicles.available],
    ["Vehicles", "On Trip", summary.vehicles.onTrip],
    ["Vehicles", "In Shop", summary.vehicles.inShop],
    ["Vehicles", "Retired", summary.vehicles.retired],
    ["Drivers", "Total", summary.drivers.total],
    ["Drivers", "Available", summary.drivers.available],
    ["Drivers", "On Trip", summary.drivers.onTrip],
    ["Drivers", "Off Duty", summary.drivers.offDuty],
    ["Drivers", "Suspended", summary.drivers.suspended],
    ["Trips", "Total", summary.trips.total],
    ["Trips", "Draft", summary.trips.draft],
    ["Trips", "Dispatched", summary.trips.dispatched],
    ["Trips", "Completed", summary.trips.completed],
    ["Trips", "Cancelled", summary.trips.cancelled],
    ["Maintenance", "Open", summary.maintenance.open],
    ["Maintenance", "Completed", summary.maintenance.completed],
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    fileName: `transitops-report-${stamp}.csv`,
    contentType: "text/csv; charset=utf-8",
    content: csv,
    generatedAt: summary.generatedAt,
  };
};

module.exports = {
  getTripReport,
  getVehicleReport,
  getDriverReport,
  getMaintenanceReport,
  getFuelReport,
  getExpenseReport,
  getFinancialSummary,
  getReportSummary,
  exportReportCsv,
};
