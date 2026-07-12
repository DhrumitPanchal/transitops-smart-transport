const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const { emitDomainEvent, serializeValue } = require("../../utils/socketEmitter");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getRoles = async ({
  page = 1,
  limit = 20,
  search,
  sortBy = "name",
  sortOrder = "asc",
} = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = search
    ? {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [roles, totalRecords] = await Promise.all([
    prisma.role.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: [{ isSystem: "desc" }, { [sortBy]: sortOrder }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true } },
      },
    }),
    prisma.role.count({ where }),
  ]);

  return {
    items: roles.map((role) => ({
      ...role,
      userCount: role._count.users,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / safeLimit),
    },
  };
};

const getRoleById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      _count: { select: { users: true } },
    },
  });

  if (!role) {
    return null;
  }

  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    userCount: role._count.users,
    permissions: role.rolePermissions.map((item) => item.permission.code),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};

const createRole = async ({ code, name, description }, actor) => {
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();
  const normalizedName = String(name || "").trim();
  const normalizedDescription = description ? String(description).trim() : null;

  const existingRole = await prisma.role.findFirst({
    where: {
      OR: [{ code: normalizedCode }, { name: normalizedName }],
    },
  });

  if (existingRole) {
    const error = new Error("Role code or name already exists.");
    error.statusCode = 409;
    throw error;
  }

  const role = await prisma.role.create({
    data: {
      code: normalizedCode,
      name: normalizedName,
      description: normalizedDescription,
      isSystem: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: actor?.id || null,
      module: "roles",
      action: "CREATE_ROLE",
      recordId: role.id,
      oldValue: null,
      newValue: {
        code: role.code,
        name: role.name,
        description: role.description,
      },
      ipAddress: actor?.ipAddress || null,
      userAgent: actor?.userAgent || null,
    },
  });

  const serialized = serializeValue({ ...role, permissions: [] });

  emitDomainEvent("role.created", {
    actorUserId: actor?.id || null,
    excludeSocketId: actor?.socketId,
    data: { role: serialized },
  });

  return serialized;
};

const updateRole = async ({ id, name, description }, actor) => {
  const role = await prisma.role.findUnique({ where: { id } });

  if (!role) {
    const error = new Error("Role not found.");
    error.statusCode = 404;
    throw error;
  }

  const normalizedName = String(name || "").trim();
  if (normalizedName && normalizedName !== role.name) {
    const duplicate = await prisma.role.findFirst({
      where: { name: normalizedName },
    });
    if (duplicate && duplicate.id !== role.id) {
      const error = new Error("Role name already exists.");
      error.statusCode = 409;
      throw error;
    }
  }

  const updatedRole = await prisma.role.update({
    where: { id },
    data: {
      name: normalizedName || role.name,
      description:
        description === undefined
          ? role.description
          : String(description).trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: actor?.id || null,
      module: "roles",
      action: "UPDATE_ROLE",
      recordId: updatedRole.id,
      oldValue: {
        name: role.name,
        description: role.description,
      },
      newValue: {
        name: updatedRole.name,
        description: updatedRole.description,
      },
      ipAddress: actor?.ipAddress || null,
      userAgent: actor?.userAgent || null,
    },
  });

  const detailed = await getRoleById(updatedRole.id);
  const serialized = serializeValue(detailed);

  emitDomainEvent("role.updated", {
    actorUserId: actor?.id || null,
    excludeSocketId: actor?.socketId,
    data: { role: serialized },
  });

  return serialized;
};

const getPermissions = async () => {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { code: "asc" }],
    select: {
      module: true,
      code: true,
    },
  });

  const grouped = permissions.reduce((acc, permission) => {
    const existing = acc.find((item) => item.module === permission.module);
    if (existing) {
      existing.permissions.push(permission.code);
    } else {
      acc.push({
        module: permission.module,
        permissions: [permission.code],
      });
    }
    return acc;
  }, []);

  return grouped;
};

const updateRolePermissions = async ({ id, permissions }, actor) => {
  const role = await prisma.role.findUnique({ where: { id } });

  if (!role) {
    const error = new Error("Role not found.");
    error.statusCode = 404;
    throw error;
  }

  if (role.code === "SUPER_ADMIN") {
    const error = new Error("Super admin role permissions cannot be modified.");
    error.statusCode = 403;
    throw error;
  }

  const uniquePermissions = [...new Set(permissions || [])];
  if (uniquePermissions.length !== (permissions || []).length) {
    const error = new Error("Permission list cannot contain duplicates.");
    error.statusCode = 400;
    throw error;
  }

  const existingPermissions = await prisma.permission.findMany({
    where: { code: { in: uniquePermissions } },
    select: { id: true, code: true },
  });

  if (existingPermissions.length !== uniquePermissions.length) {
    const error = new Error("One or more permissions are invalid.");
    error.statusCode = 400;
    throw error;
  }

  const previousPermissions = await prisma.rolePermission.findMany({
    where: { roleId: id },
    include: { permission: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: id } });

    if (uniquePermissions.length > 0) {
      const permissionIds = existingPermissions.map(
        (permission) => permission.id,
      );
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: actor?.id || null,
      module: "roles",
      action: "UPDATE_ROLE_PERMISSIONS",
      recordId: role.id,
      oldValue: previousPermissions.map((item) => item.permission.code),
      newValue: uniquePermissions,
      ipAddress: actor?.ipAddress || null,
      userAgent: actor?.userAgent || null,
    },
  });

  const detailed = await getRoleById(id);
  const serialized = serializeValue(detailed);

  emitDomainEvent("role.permissions_updated", {
    actorUserId: actor?.id || null,
    excludeSocketId: actor?.socketId,
    data: {
      role: serialized,
      permissions: uniquePermissions,
    },
  });

  // Alias for clients/docs that listen to role.permissions_changed
  emitDomainEvent("role.permissions_changed", {
    actorUserId: actor?.id || null,
    excludeSocketId: actor?.socketId,
    data: {
      role: serialized,
      permissions: uniquePermissions,
    },
  });

  return detailed;
};

module.exports = {
  getRoles,
  getRoleById,
  getPermissions,
  createRole,
  updateRole,
  updateRolePermissions,
};
