require("dotenv").config();

const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../generated/prisma");
const {
  ROLES,
  ROLE_LABELS,
  PERMISSION_KEYS,
} = require("../src/constants");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to seed.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ALL_PERMISSIONS = Object.values(PERMISSION_KEYS);
const DEMO_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

const ROLE_PERMISSION_MAP = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLES.FLEET_MANAGER]: [
    PERMISSION_KEYS.DASHBOARD_VIEW,
    PERMISSION_KEYS.VEHICLES_VIEW,
    PERMISSION_KEYS.VEHICLES_CREATE,
    PERMISSION_KEYS.VEHICLES_EDIT,
    PERMISSION_KEYS.VEHICLES_RETIRE,
    PERMISSION_KEYS.MAINTENANCE_VIEW,
    PERMISSION_KEYS.MAINTENANCE_CREATE,
    PERMISSION_KEYS.MAINTENANCE_EDIT,
    PERMISSION_KEYS.MAINTENANCE_COMPLETE,
    PERMISSION_KEYS.MAINTENANCE_CANCEL,
    PERMISSION_KEYS.DRIVERS_VIEW,
    PERMISSION_KEYS.TRIPS_VIEW,
    PERMISSION_KEYS.FUEL_VIEW,
    PERMISSION_KEYS.EXPENSES_VIEW,
    PERMISSION_KEYS.REPORTS_VIEW,
    PERMISSION_KEYS.REPORTS_EXPORT,
  ],
  [ROLES.DISPATCHER]: [
    PERMISSION_KEYS.DASHBOARD_VIEW,
    PERMISSION_KEYS.VEHICLES_VIEW,
    PERMISSION_KEYS.DRIVERS_VIEW,
    PERMISSION_KEYS.TRIPS_VIEW,
    PERMISSION_KEYS.TRIPS_CREATE,
    PERMISSION_KEYS.TRIPS_EDIT_DRAFT,
    PERMISSION_KEYS.TRIPS_DISPATCH,
    PERMISSION_KEYS.TRIPS_COMPLETE,
    PERMISSION_KEYS.TRIPS_CANCEL,
    PERMISSION_KEYS.MAINTENANCE_VIEW,
    PERMISSION_KEYS.FUEL_VIEW,
    PERMISSION_KEYS.FUEL_CREATE,
    PERMISSION_KEYS.EXPENSES_VIEW,
    PERMISSION_KEYS.EXPENSES_CREATE,
    PERMISSION_KEYS.REPORTS_VIEW,
  ],
  [ROLES.SAFETY_OFFICER]: [
    PERMISSION_KEYS.DASHBOARD_VIEW,
    PERMISSION_KEYS.VEHICLES_VIEW,
    PERMISSION_KEYS.DRIVERS_VIEW,
    PERMISSION_KEYS.DRIVERS_CREATE,
    PERMISSION_KEYS.DRIVERS_EDIT,
    PERMISSION_KEYS.DRIVERS_CHANGE_STATUS,
    PERMISSION_KEYS.DRIVERS_SUSPEND,
    PERMISSION_KEYS.TRIPS_VIEW,
    PERMISSION_KEYS.MAINTENANCE_VIEW,
    PERMISSION_KEYS.REPORTS_VIEW,
  ],
  [ROLES.FINANCIAL_ANALYST]: [
    PERMISSION_KEYS.DASHBOARD_VIEW,
    PERMISSION_KEYS.VEHICLES_VIEW,
    PERMISSION_KEYS.DRIVERS_VIEW,
    PERMISSION_KEYS.TRIPS_VIEW,
    PERMISSION_KEYS.MAINTENANCE_VIEW,
    PERMISSION_KEYS.FUEL_VIEW,
    PERMISSION_KEYS.FUEL_CREATE,
    PERMISSION_KEYS.FUEL_EDIT,
    PERMISSION_KEYS.FUEL_DELETE,
    PERMISSION_KEYS.EXPENSES_VIEW,
    PERMISSION_KEYS.EXPENSES_CREATE,
    PERMISSION_KEYS.EXPENSES_EDIT,
    PERMISSION_KEYS.EXPENSES_DELETE,
    PERMISSION_KEYS.REPORTS_VIEW,
    PERMISSION_KEYS.REPORTS_EXPORT,
  ],
};

const daysFromNow = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const hoursFromNow = (hours) => {
  const date = new Date();
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return date;
};

async function seedPermissionsAndRoles() {
  console.log("Seeding permissions...");
  for (const code of ALL_PERMISSIONS) {
    const [module] = code.split(".");
    await prisma.permission.upsert({
      where: { code },
      update: { module, description: code },
      create: { code, module, description: code },
    });
  }

  console.log("Seeding roles...");
  const roleIds = {};
  for (const code of Object.values(ROLES)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: {
        name: ROLE_LABELS[code],
        description: ROLE_LABELS[code],
        isSystem: true,
      },
      create: {
        code,
        name: ROLE_LABELS[code],
        description: ROLE_LABELS[code],
        isSystem: true,
      },
    });
    roleIds[code] = role.id;
  }

  console.log("Seeding role_permissions...");
  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
    const roleId = roleIds[roleCode];
    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUnique({
        where: { code: permissionCode },
      });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId: permission.id,
        },
      });
    }
  }

  return roleIds;
}

async function seedUsers(roleIds, passwordHash) {
  console.log("Seeding users...");

  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@transitops.com"
  ).toLowerCase();

  const demoUsers = [
    {
      email: adminEmail,
      firstName: "Super",
      lastName: "Admin",
      phone: "+91-9000000001",
      status: "ACTIVE",
      roleId: roleIds[ROLES.SUPER_ADMIN],
    },
    {
      email: "fleet@transitops.com",
      firstName: "Farah",
      lastName: "Fleet",
      phone: "+91-9000000002",
      status: "ACTIVE",
      roleId: roleIds[ROLES.FLEET_MANAGER],
    },
    {
      email: "dispatch@transitops.com",
      firstName: "Dev",
      lastName: "Dispatcher",
      phone: "+91-9000000003",
      status: "ACTIVE",
      roleId: roleIds[ROLES.DISPATCHER],
    },
    {
      email: "safety@transitops.com",
      firstName: "Sam",
      lastName: "Safety",
      phone: "+91-9000000004",
      status: "ACTIVE",
      roleId: roleIds[ROLES.SAFETY_OFFICER],
    },
    {
      email: "finance@transitops.com",
      firstName: "Fiona",
      lastName: "Finance",
      phone: "+91-9000000005",
      status: "ACTIVE",
      roleId: roleIds[ROLES.FINANCIAL_ANALYST],
    },
    {
      email: "pending@transitops.com",
      firstName: "Pat",
      lastName: "Pending",
      phone: "+91-9000000006",
      status: "PENDING",
      roleId: null,
    },
    {
      email: "inactive@transitops.com",
      firstName: "Ian",
      lastName: "Inactive",
      phone: "+91-9000000007",
      status: "INACTIVE",
      roleId: roleIds[ROLES.DISPATCHER],
    },
  ];

  const usersByEmail = {};
  for (const user of demoUsers) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        password: passwordHash,
        status: user.status,
        roleId: user.roleId,
      },
      create: {
        ...user,
        password: passwordHash,
      },
    });
    usersByEmail[user.email] = saved;
  }

  return usersByEmail;
}

async function seedVehicles() {
  console.log("Seeding vehicles...");

  const vehicleDefs = [
    {
      registrationNumber: "MH12AB1001",
      vehicleName: "Alpha Truck",
      vehicleType: "TRUCK",
      capacity: 12000,
      currentOdometer: 45200,
      purchaseCost: 1850000,
      manufactureYear: 2021,
      region: "Pune",
      status: "AVAILABLE",
    },
    {
      registrationNumber: "MH12CD2002",
      vehicleName: "Beta Van",
      vehicleType: "VAN",
      capacity: 3500,
      currentOdometer: 28150,
      purchaseCost: 980000,
      manufactureYear: 2022,
      region: "Mumbai",
      status: "ON_TRIP",
    },
    {
      registrationNumber: "MH14EF3003",
      vehicleName: "Gamma Pickup",
      vehicleType: "PICKUP",
      capacity: 1500,
      currentOdometer: 19400,
      purchaseCost: 720000,
      manufactureYear: 2020,
      region: "Nashik",
      status: "IN_SHOP",
    },
    {
      registrationNumber: "MH12GH4004",
      vehicleName: "Delta Container",
      vehicleType: "CONTAINER",
      capacity: 18000,
      currentOdometer: 61000,
      purchaseCost: 2450000,
      manufactureYear: 2019,
      region: "Pune",
      status: "AVAILABLE",
    },
    {
      registrationNumber: "MH12IJ5005",
      vehicleName: "Echo Retired",
      vehicleType: "TRUCK",
      capacity: 10000,
      currentOdometer: 182000,
      purchaseCost: 1100000,
      manufactureYear: 2015,
      region: "Nagpur",
      status: "RETIRED",
    },
  ];

  const vehicles = [];
  for (const def of vehicleDefs) {
    const vehicle = await prisma.vehicle.upsert({
      where: { registrationNumber: def.registrationNumber },
      update: { ...def, isDeleted: false },
      create: def,
    });
    vehicles.push(vehicle);
  }

  return vehicles;
}

async function seedVehicleDocuments(vehicles) {
  console.log("Seeding vehicle_documents...");

  for (const vehicle of vehicles.slice(0, 3)) {
    const existing = await prisma.vehicleDocument.count({
      where: { vehicleId: vehicle.id },
    });
    if (existing > 0) continue;

    await prisma.vehicleDocument.createMany({
      data: [
        {
          vehicleId: vehicle.id,
          documentType: "RC",
          number: `RC-${vehicle.registrationNumber}`,
          expiryDate: daysFromNow(400),
          fileUrl: null,
        },
        {
          vehicleId: vehicle.id,
          documentType: "INSURANCE",
          number: `INS-${vehicle.registrationNumber}`,
          expiryDate: daysFromNow(180),
          fileUrl: null,
        },
        {
          vehicleId: vehicle.id,
          documentType: "FITNESS",
          number: `FIT-${vehicle.registrationNumber}`,
          expiryDate: daysFromNow(90),
          fileUrl: null,
        },
      ],
    });
  }
}

async function seedDrivers() {
  console.log("Seeding drivers...");

  const driverDefs = [
    {
      employeeCode: "DRV-1001",
      firstName: "Ravi",
      lastName: "Patil",
      phone: "+91-9811100001",
      email: "ravi.patil@transitops.com",
      licenseNumber: "MH1420110001234",
      licenseCategory: "HGV",
      licenseExpiryDate: daysFromNow(320),
      safetyScore: 96,
      address: "Hadapsar, Pune",
      joiningDate: daysFromNow(-900),
      status: "AVAILABLE",
    },
    {
      employeeCode: "DRV-1002",
      firstName: "Anita",
      lastName: "Sharma",
      phone: "+91-9811100002",
      email: "anita.sharma@transitops.com",
      licenseNumber: "MH1420120005678",
      licenseCategory: "LMV",
      licenseExpiryDate: daysFromNow(120),
      safetyScore: 91,
      address: "Andheri, Mumbai",
      joiningDate: daysFromNow(-600),
      status: "ON_TRIP",
    },
    {
      employeeCode: "DRV-1003",
      firstName: "Imran",
      lastName: "Khan",
      phone: "+91-9811100003",
      email: "imran.khan@transitops.com",
      licenseNumber: "MH1420130009012",
      licenseCategory: "HGV",
      licenseExpiryDate: daysFromNow(45),
      safetyScore: 84,
      address: "Nashik Road",
      joiningDate: daysFromNow(-400),
      status: "OFF_DUTY",
    },
    {
      employeeCode: "DRV-1004",
      firstName: "Suresh",
      lastName: "More",
      phone: "+91-9811100004",
      email: "suresh.more@transitops.com",
      licenseNumber: "MH1420140003456",
      licenseCategory: "HGV",
      licenseExpiryDate: daysFromNow(-10),
      safetyScore: 72,
      address: "Wakad, Pune",
      joiningDate: daysFromNow(-1100),
      status: "SUSPENDED",
    },
  ];

  const drivers = [];
  for (const def of driverDefs) {
    const driver = await prisma.driver.upsert({
      where: { employeeCode: def.employeeCode },
      update: { ...def, isDeleted: false },
      create: def,
    });
    drivers.push(driver);
  }

  return drivers;
}

async function seedDriverDocuments(drivers) {
  console.log("Seeding driver_documents...");

  for (const driver of drivers.slice(0, 3)) {
    const existing = await prisma.driverDocument.count({
      where: { driverId: driver.id },
    });
    if (existing > 0) continue;

    await prisma.driverDocument.createMany({
      data: [
        {
          driverId: driver.id,
          type: "LICENSE",
          documentNumber: driver.licenseNumber,
          expiryDate: driver.licenseExpiryDate,
          fileUrl: null,
        },
        {
          driverId: driver.id,
          type: "AADHAAR",
          documentNumber: `AADHAAR-${driver.employeeCode}`,
          expiryDate: null,
          fileUrl: null,
        },
      ],
    });
  }
}

async function seedTrips(vehicles, drivers, createdBy) {
  console.log("Seeding trips...");

  const tripDefs = [
    {
      tripNumber: "TRP-2026-0001",
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
      source: "Pune Warehouse",
      destination: "Mumbai Port",
      cargo: "Electronics",
      cargoWeight: 4200,
      distance: 155,
      plannedStart: hoursFromNow(24),
      plannedEnd: hoursFromNow(32),
      status: "DRAFT",
    },
    {
      tripNumber: "TRP-2026-0002",
      vehicleId: vehicles[1].id,
      driverId: drivers[1].id,
      source: "Mumbai Hub",
      destination: "Nashik Depot",
      cargo: "FMCG",
      cargoWeight: 2100,
      distance: 170,
      plannedStart: hoursFromNow(-6),
      plannedEnd: hoursFromNow(4),
      actualStart: hoursFromNow(-5),
      startOdometer: 28150,
      status: "IN_PROGRESS",
    },
    {
      tripNumber: "TRP-2026-0003",
      vehicleId: vehicles[3].id,
      driverId: drivers[0].id,
      source: "Pune",
      destination: "Nagpur",
      cargo: "Auto parts",
      cargoWeight: 8900,
      distance: 720,
      plannedStart: hoursFromNow(-80),
      plannedEnd: hoursFromNow(-60),
      actualStart: hoursFromNow(-79),
      actualEnd: hoursFromNow(-58),
      startOdometer: 60200,
      finalOdometer: 60940,
      fuelConsumed: 180,
      remarks: "Delivered on time",
      status: "COMPLETED",
    },
    {
      tripNumber: "TRP-2026-0004",
      vehicleId: vehicles[0].id,
      driverId: drivers[2].id,
      source: "Nashik",
      destination: "Aurangabad",
      cargo: "Textiles",
      cargoWeight: 3000,
      distance: 210,
      plannedStart: hoursFromNow(48),
      plannedEnd: hoursFromNow(56),
      status: "DISPATCHED",
    },
    {
      tripNumber: "TRP-2026-0005",
      vehicleId: vehicles[3].id,
      driverId: drivers[1].id,
      source: "Pune",
      destination: "Kolhapur",
      cargo: "Machinery",
      cargoWeight: 6500,
      distance: 240,
      plannedStart: hoursFromNow(-40),
      plannedEnd: hoursFromNow(-30),
      remarks: "Cancelled due to weather",
      status: "CANCELLED",
    },
  ];

  const trips = [];
  for (const def of tripDefs) {
    const trip = await prisma.trip.upsert({
      where: { tripNumber: def.tripNumber },
      update: { ...def, createdBy },
      create: { ...def, createdBy },
    });
    trips.push(trip);
  }

  return trips;
}

async function seedMaintenances(vehicles, createdBy) {
  console.log("Seeding vehicle_maintenances...");

  const defs = [
    {
      maintenanceNumber: "MNT-2026-0001",
      vehicleId: vehicles[2].id,
      maintenanceType: "OIL_CHANGE",
      title: "Scheduled oil change",
      description: "Engine oil and filter replacement",
      serviceCenter: "Pune Service Hub",
      scheduledDate: daysFromNow(3),
      estimatedCost: 4500,
      currentOdometer: 19400,
      nextServiceOdometer: 24400,
      status: "SCHEDULED",
    },
    {
      maintenanceNumber: "MNT-2026-0002",
      vehicleId: vehicles[2].id,
      maintenanceType: "BRAKE_SERVICE",
      title: "Brake pad replacement",
      description: "Front brake pads worn",
      serviceCenter: "Nashik Auto Care",
      scheduledDate: daysFromNow(-2),
      estimatedCost: 8500,
      currentOdometer: 19380,
      status: "IN_PROGRESS",
    },
    {
      maintenanceNumber: "MNT-2026-0003",
      vehicleId: vehicles[0].id,
      maintenanceType: "INSPECTION",
      title: "Quarterly inspection",
      description: "Safety and fitness inspection",
      serviceCenter: "Pune RTO Partner",
      scheduledDate: daysFromNow(-30),
      completedDate: daysFromNow(-28),
      estimatedCost: 3000,
      actualCost: 3200,
      currentOdometer: 44800,
      nextServiceOdometer: 49800,
      remarks: "Passed inspection",
      status: "COMPLETED",
    },
    {
      maintenanceNumber: "MNT-2026-0004",
      vehicleId: vehicles[3].id,
      maintenanceType: "TIRE_SERVICE",
      title: "Tyre rotation cancelled",
      description: "Vendor unavailable",
      serviceCenter: "Fleet Tyre Point",
      scheduledDate: daysFromNow(-5),
      estimatedCost: 6000,
      currentOdometer: 60800,
      remarks: "Reschedule next week",
      status: "CANCELLED",
    },
  ];

  for (const def of defs) {
    await prisma.vehicleMaintenance.upsert({
      where: { maintenanceNumber: def.maintenanceNumber },
      update: { ...def, createdBy, isDeleted: false },
      create: { ...def, createdBy },
    });
  }
}

async function seedFuelLogs(vehicles, drivers, trips, createdBy) {
  console.log("Seeding vehicle_fuel_logs...");

  const existing = await prisma.vehicleFuelLog.count({
    where: { receiptNumber: { startsWith: "SEED-FUEL-" } },
  });
  if (existing > 0) {
    console.log("  fuel logs already seeded, skipping");
    return;
  }

  await prisma.vehicleFuelLog.createMany({
    data: [
      {
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        tripId: trips[2].id,
        fuelStation: "IOCL Wakad",
        fuelType: "DIESEL",
        quantity: 80,
        pricePerUnit: 94.5,
        totalAmount: 7560,
        odometerReading: 60500,
        fuelDate: daysFromNow(-60),
        receiptNumber: "SEED-FUEL-0001",
        remarks: "Full tank before long haul",
        createdBy,
      },
      {
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        tripId: trips[1].id,
        fuelStation: "BPCL Andheri",
        fuelType: "DIESEL",
        quantity: 45,
        pricePerUnit: 95.2,
        totalAmount: 4284,
        odometerReading: 28200,
        fuelDate: daysFromNow(0),
        receiptNumber: "SEED-FUEL-0002",
        createdBy,
      },
      {
        vehicleId: vehicles[3].id,
        driverId: drivers[0].id,
        tripId: null,
        fuelStation: "HPCL Pune",
        fuelType: "DIESEL",
        quantity: 100,
        pricePerUnit: 94.8,
        totalAmount: 9480,
        odometerReading: 61050,
        fuelDate: daysFromNow(-7),
        receiptNumber: "SEED-FUEL-0003",
        createdBy,
      },
    ],
  });
}

async function seedExpenses(vehicles, drivers, trips, createdBy) {
  console.log("Seeding expenses...");

  const existing = await prisma.expense.count({
    where: { title: { startsWith: "SEED:" } },
  });
  if (existing > 0) {
    console.log("  expenses already seeded, skipping");
    return;
  }

  await prisma.expense.createMany({
    data: [
      {
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        tripId: trips[2].id,
        category: "TOLL",
        title: "SEED: Expressway toll",
        amount: 1250,
        expenseDate: daysFromNow(-58),
        vendor: "MSRDC",
        paymentMethod: "UPI",
        remarks: "Pune-Nagpur corridor",
        createdBy,
      },
      {
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        tripId: trips[1].id,
        category: "PARKING",
        title: "SEED: Hub parking",
        amount: 300,
        expenseDate: daysFromNow(0),
        vendor: "Mumbai Hub",
        paymentMethod: "CASH",
        createdBy,
      },
      {
        vehicleId: vehicles[2].id,
        driverId: drivers[2].id,
        tripId: null,
        category: "REPAIR",
        title: "SEED: Minor roadside repair",
        amount: 1800,
        expenseDate: daysFromNow(-3),
        vendor: "Local Garage",
        paymentMethod: "CARD",
        remarks: "Battery terminal fix",
        createdBy,
      },
      {
        vehicleId: null,
        driverId: drivers[0].id,
        tripId: null,
        category: "FOOD",
        title: "SEED: Driver meal allowance",
        amount: 450,
        expenseDate: daysFromNow(-2),
        vendor: "Dhaba Express",
        paymentMethod: "UPI",
        createdBy,
      },
      {
        vehicleId: vehicles[3].id,
        driverId: null,
        tripId: trips[2].id,
        category: "FINE",
        title: "SEED: Overweight fine",
        amount: 2000,
        expenseDate: daysFromNow(-57),
        vendor: "Traffic Dept",
        paymentMethod: "ONLINE",
        createdBy,
      },
    ],
  });
}

async function seedAuditLogs(adminUser, vehicles, trips) {
  console.log("Seeding audit_logs...");

  const existing = await prisma.auditLog.count({
    where: { action: { startsWith: "SEED_" } },
  });
  if (existing > 0) {
    console.log("  audit logs already seeded, skipping");
    return;
  }

  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        module: "auth",
        action: "SEED_LOGIN",
        recordId: adminUser.id,
        oldValue: null,
        newValue: { email: adminUser.email },
        ipAddress: "127.0.0.1",
        userAgent: "TransitOps-Seed/1.0",
      },
      {
        userId: adminUser.id,
        module: "vehicles",
        action: "SEED_VEHICLE_CREATED",
        recordId: vehicles[0].id,
        oldValue: null,
        newValue: { registrationNumber: vehicles[0].registrationNumber },
        ipAddress: "127.0.0.1",
        userAgent: "TransitOps-Seed/1.0",
      },
      {
        userId: adminUser.id,
        module: "trips",
        action: "SEED_TRIP_COMPLETED",
        recordId: trips[2].id,
        oldValue: { status: "IN_PROGRESS" },
        newValue: { status: "COMPLETED" },
        ipAddress: "127.0.0.1",
        userAgent: "TransitOps-Seed/1.0",
      },
    ],
  });
}

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const roleIds = await seedPermissionsAndRoles();
  const usersByEmail = await seedUsers(roleIds, passwordHash);

  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@transitops.com"
  ).toLowerCase();
  const adminUser = usersByEmail[adminEmail];

  const vehicles = await seedVehicles();
  await seedVehicleDocuments(vehicles);

  const drivers = await seedDrivers();
  await seedDriverDocuments(drivers);

  const trips = await seedTrips(vehicles, drivers, adminUser.id);
  await seedMaintenances(vehicles, adminUser.id);
  await seedFuelLogs(vehicles, drivers, trips, adminUser.id);
  await seedExpenses(vehicles, drivers, trips, adminUser.id);
  await seedAuditLogs(adminUser, vehicles, trips);

  console.log("\nSeed completed for all tables.");
  console.log("Demo logins (password for all ACTIVE users):", DEMO_PASSWORD);
  console.log("  admin@transitops.com     → SUPER_ADMIN");
  console.log("  fleet@transitops.com     → FLEET_MANAGER");
  console.log("  dispatch@transitops.com  → DISPATCHER");
  console.log("  safety@transitops.com    → SAFETY_OFFICER");
  console.log("  finance@transitops.com   → FINANCIAL_ANALYST");
  console.log("  pending@transitops.com   → PENDING (awaiting approval)");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
