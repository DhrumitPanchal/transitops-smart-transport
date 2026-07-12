require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const { PrismaClient } = require("../../../generated/prisma");
const AppError = require("../../common/AppError");
const { emitDomainEvent, emitToUser } = require("../../utils/socketEmitter");
const {
  splitFullName,
  normalizeEmail,
  buildPermissionList,
  buildUserResponse,
  isLoginAllowedStatus,
} = require("./auth.helpers");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

const signToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      roleId: user.roleId || null,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

const loadPermissionsForRole = async (roleId) => {
  if (!roleId) return [];

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });

  return buildPermissionList(rolePermissions);
};

const register = async ({ name, firstName, lastName, email, password }) => {
  const normalizedEmail = normalizeEmail(email);

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

  let resolvedFirstName = firstName;
  let resolvedLastName = lastName;

  if (!resolvedFirstName || !resolvedLastName) {
    const split = splitFullName(name);
    resolvedFirstName = resolvedFirstName || split.firstName;
    resolvedLastName = resolvedLastName || split.lastName;
  }

  if (!resolvedFirstName || !resolvedLastName) {
    throw new AppError(
      400,
      "Name is required.",
      true,
      { name: "Name is required" },
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

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: String(resolvedFirstName).trim(),
      lastName: String(resolvedLastName).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      status: "PENDING",
      roleId: null,
    },
    include: { role: true },
  });

  const responseUser = buildUserResponse(user, []);
  const token = signToken(user);

  emitDomainEvent("user.created", {
    actorUserId: user.id,
    data: responseUser,
    rooms: ["admin"],
  });

  return {
    user: responseUser,
    token,
    cookieOptions: getCookieOptions(),
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(
      401,
      "Invalid email or password",
      true,
      null,
      "INVALID_CREDENTIALS",
    );
  }

  if (user.status === "INACTIVE") {
    throw new AppError(
      403,
      "Your account is inactive. Contact the administrator.",
      true,
      null,
      "USER_INACTIVE",
    );
  }

  if (!isLoginAllowedStatus(user.status)) {
    throw new AppError(
      403,
      "Your account is inactive. Contact the administrator.",
      true,
      null,
      "USER_INACTIVE",
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(
      401,
      "Invalid email or password",
      true,
      null,
      "INVALID_CREDENTIALS",
    );
  }

  const permissions = await loadPermissionsForRole(user.roleId);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = signToken(user);

  return {
    user: buildUserResponse(user, permissions),
    token,
    cookieOptions: getCookieOptions(),
  };
};

const getCurrentUser = async (authenticatedUser) => {
  const user = await prisma.user.findUnique({
    where: { id: authenticatedUser.id },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  if (user.status === "INACTIVE") {
    throw new AppError(
      403,
      "Your account is inactive. Contact the administrator.",
      true,
      null,
      "USER_INACTIVE",
    );
  }

  const permissions = await loadPermissionsForRole(user.roleId);
  return buildUserResponse(user, permissions);
};

const logout = () => ({ success: true });

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  // exported for tests / reuse
  buildUserResponse,
  splitFullName,
  normalizeEmail,
  emitToUser,
};
