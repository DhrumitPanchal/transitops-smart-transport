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

async function seed() {
  console.log("Seeding permissions...");
  for (const code of ALL_PERMISSIONS) {
    const [module] = code.split(".");
    await prisma.permission.upsert({
      where: { code },
      update: { module },
      create: {
        code,
        module,
        description: code,
      },
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

  console.log("Seeding role permissions...");
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

  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@transitops.com"
  ).toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

  console.log(`Seeding Super Admin (${adminEmail})...`);
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: "Super",
      lastName: "Admin",
      password: passwordHash,
      status: "ACTIVE",
      roleId: roleIds[ROLES.SUPER_ADMIN],
    },
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: adminEmail,
      password: passwordHash,
      status: "ACTIVE",
      roleId: roleIds[ROLES.SUPER_ADMIN],
    },
  });

  console.log("Seed completed.");
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
