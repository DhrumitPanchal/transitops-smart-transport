const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const AppError = require("../../common/AppError");
const { ROLES } = require("../../constants");
const {
  splitFullName,
  normalizeEmail,
  buildPermissionList,
  buildUserResponse,
} = require("../auth/auth.helpers");
const { emitDomainEvent, emitToUser } = require("../../utils/socketEmitter");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
  roleId: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: { id: true, code: true, name: true },
  },
};

const toSafeUser = async (user) => {
  if (!user) return null;
  const permissions = user.roleId
    ? buildPermissionList(
        await prisma.rolePermission.findMany({
          where: { roleId: user.roleId },
          include: { permission: true },
        }),
      )
    : [];
  return buildUserResponse(user, permissions);
};

const resolveRole = async ({ role, roleId }) => {
  if (roleId) {
    const byId = await prisma.role.findUnique({ where: { id: roleId } });
    if (!byId) {
      throw new AppError(
        400,
        "Role does not exist",
        true,
        { role: "Role does not exist" },
        "INVALID_ROLE",
      );
    }
    return byId;
  }

  if (!role) return null;

  const code = String(role).trim().toUpperCase();
  const byCode = await prisma.role.findUnique({ where: { code } });
  if (!byCode) {
    throw new AppError(
      400,
      "Role does not exist",
      true,
      { role: "Role does not exist" },
      "INVALID_ROLE",
    );
  }
  return byCode;
};

const getUsers = async ({
  page = 1,
  limit = 10,
  search,
  roleId,
  status,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  const allowedSort = new Set([
    "createdAt",
    "updatedAt",
    "email",
    "firstName",
    "lastName",
    "status",
    "lastLogin",
  ]);
  const safeSortBy = allowedSort.has(sortBy) ? sortBy : "createdAt";
  const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const where = {
    AND: [
      search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      roleId ? { roleId } : {},
      status ? { status } : {},
    ].filter((clause) => Object.keys(clause).length > 0),
  };

  const [items, totalRecords] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { [safeSortBy]: safeSortOrder },
      select: USER_SELECT,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: items.map((user) => buildUserResponse(user, [])),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / safeLimit),
    },
  };
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });
  return toSafeUser(user);
};

const createUser = async (payload, actor) => {
  const normalizedEmail = normalizeEmail(payload.email);
  const password = payload.password;

  if (!normalizedEmail || !password) {
    throw new AppError(
      400,
      "Email and password are required.",
      true,
      {
        ...(normalizedEmail ? {} : { email: "Email is required" }),
        ...(password ? {} : { password: "Password is required" }),
      },
      "VALIDATION_ERROR",
    );
  }

  if (String(password).length < 8) {
    throw new AppError(
      400,
      "Password must be at least 8 characters",
      true,
      { password: "Password must be at least 8 characters" },
      "VALIDATION_ERROR",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new AppError(
      409,
      "A user with this email already exists.",
      true,
      { email: "This email is already registered." },
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const role = await resolveRole({
    role: payload.role,
    roleId: payload.roleId,
  });
  if (!role) {
    throw new AppError(
      400,
      "Role is required",
      true,
      { role: "Role is required" },
      "INVALID_ROLE",
    );
  }

  const status = payload.status || "ACTIVE";
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new AppError(
      400,
      "Invalid user status",
      true,
      { status: "Invalid user status" },
      "INVALID_STATUS",
    );
  }

  let firstName = payload.firstName;
  let lastName = payload.lastName;
  if (!firstName || !lastName) {
    const split = splitFullName(payload.name);
    firstName = firstName || split.firstName;
    lastName = lastName || split.lastName;
  }

  if (!firstName || !lastName) {
    throw new AppError(
      400,
      "Name is required",
      true,
      { name: "Name is required" },
      "VALIDATION_ERROR",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: payload.phone || null,
      status,
      roleId: role.id,
    },
    select: USER_SELECT,
  });

  const safeUser = await toSafeUser(user);

  emitDomainEvent("user.created", {
    actorUserId: actor?.id || null,
    data: safeUser,
    rooms: ["admin"],
  });

  return safeUser;
};

const updateUser = async (id, payload, actor) => {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!existing) {
    throw new AppError(404, "User not found.");
  }

  if (existing.status === "PENDING") {
    throw new AppError(
      400,
      "Pending users must be approved before they can be edited.",
      true,
      null,
      "PENDING_REQUIRES_APPROVAL",
    );
  }

  const data = {};

  if (payload.name != null || payload.firstName != null || payload.lastName != null) {
    let firstName = payload.firstName;
    let lastName = payload.lastName;
    if (!firstName || !lastName) {
      const split = splitFullName(payload.name ?? `${existing.firstName} ${existing.lastName}`);
      firstName = firstName || split.firstName;
      lastName = lastName || split.lastName;
    }
    data.firstName = String(firstName).trim();
    data.lastName = String(lastName).trim();
  }

  if (payload.email != null) {
    const normalizedEmail = normalizeEmail(payload.email);
    const conflict = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id },
      },
    });
    if (conflict) {
      throw new AppError(
        409,
        "A user with this email already exists.",
        true,
        { email: "This email is already registered." },
        "EMAIL_ALREADY_EXISTS",
      );
    }
    data.email = normalizedEmail;
  }

  if (payload.phone !== undefined) {
    data.phone = payload.phone || null;
  }

  if (payload.role != null || payload.roleId != null) {
    const role = await resolveRole({
      role: payload.role,
      roleId: payload.roleId,
    });
    data.roleId = role.id;
  }

  if (payload.status != null) {
    if (!["ACTIVE", "INACTIVE"].includes(payload.status)) {
      throw new AppError(
        400,
        "Invalid user status",
        true,
        { status: "Invalid user status" },
        "INVALID_STATUS",
      );
    }
    if (actor?.id === id && payload.status === "INACTIVE") {
      throw new AppError(
        400,
        "You cannot deactivate your own account.",
        true,
        null,
        "CANNOT_DEACTIVATE_SELF",
      );
    }
    data.status = payload.status;
  }

  if (payload.password) {
    if (String(payload.password).length < 8) {
      throw new AppError(
        400,
        "Password must be at least 8 characters",
        true,
        { password: "Password must be at least 8 characters" },
        "VALIDATION_ERROR",
      );
    }
    data.password = await bcrypt.hash(payload.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });

  const safeUser = await toSafeUser(user);

  emitDomainEvent("user.updated", {
    actorUserId: actor?.id || null,
    data: safeUser,
    rooms: ["admin"],
  });

  emitToUser(id, "auth.session_changed", {
    actorUserId: actor?.id || null,
    data: { userId: id, reason: "profile_updated" },
  });

  return safeUser;
};

const changeStatus = async (id, status, actor) => {
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new AppError(
      400,
      "Invalid user status",
      true,
      { status: "Invalid user status" },
      "INVALID_STATUS",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!existing) {
    throw new AppError(404, "User not found.");
  }

  if (existing.status === "PENDING" && status === "ACTIVE") {
    throw new AppError(
      400,
      "Use Approve to assign a role and activate this account.",
      true,
      null,
      "PENDING_REQUIRES_APPROVAL",
    );
  }

  if (actor?.id === id && status === "INACTIVE") {
    throw new AppError(
      400,
      "You cannot deactivate your own account.",
      true,
      null,
      "CANNOT_DEACTIVATE_SELF",
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status },
    select: USER_SELECT,
  });

  const safeUser = await toSafeUser(user);

  emitDomainEvent("user.status_changed", {
    actorUserId: actor?.id || null,
    data: safeUser,
    rooms: ["admin"],
  });

  emitToUser(id, "auth.session_changed", {
    actorUserId: actor?.id || null,
    data: { userId: id, reason: "status_changed", status },
  });

  return safeUser;
};

const approveUser = async (id, payload, actor) => {
  if (actor?.id === id) {
    throw new AppError(
      400,
      "You cannot approve your own account.",
      true,
      null,
      "CANNOT_APPROVE_SELF",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!existing) {
    throw new AppError(404, "User not found.");
  }

  if (existing.status !== "PENDING") {
    throw new AppError(
      400,
      "Only pending users can be approved.",
      true,
      null,
      "NOT_PENDING",
    );
  }

  const role = await resolveRole({
    role: payload.role,
    roleId: payload.roleId,
  });

  if (!role) {
    throw new AppError(
      400,
      "Role is required",
      true,
      { role: "Select a valid role." },
      "INVALID_ROLE",
    );
  }

  if (!Object.values(ROLES).includes(role.code)) {
    throw new AppError(
      400,
      "Invalid role",
      true,
      { role: "Select a valid role." },
      "INVALID_ROLE",
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      status: "ACTIVE",
      roleId: role.id,
    },
    select: USER_SELECT,
  });

  const safeUser = await toSafeUser(user);

  emitDomainEvent("user.updated", {
    actorUserId: actor?.id || null,
    data: safeUser,
    rooms: ["admin"],
  });

  emitDomainEvent("user.status_changed", {
    actorUserId: actor?.id || null,
    data: safeUser,
    rooms: ["admin"],
  });

  emitToUser(id, "auth.session_changed", {
    actorUserId: actor?.id || null,
    data: { userId: id, reason: "approved", status: "ACTIVE" },
  });

  return safeUser;
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changeStatus,
  approveUser,
};
