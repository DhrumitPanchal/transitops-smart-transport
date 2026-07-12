require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../../config");
const { PrismaClient } = require("../../../generated/prisma");
const AppError = require("../../common/AppError");

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

const buildPermissionList = (rolePermissions) =>
  rolePermissions.map((item) => item.permission.code);

const buildUserResponse = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  status: user.status,
  role: {
    id: user.role.id,
    name: user.role.name,
  },
  permissions: user.permissions,
});

const login = async ({ email, password }) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "Your account has been deactivated.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: user.roleId },
    include: { permission: true },
  });

  const permissions = buildPermissionList(rolePermissions);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = jwt.sign(
    { userId: user.id, roleId: user.roleId, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return {
    user: buildUserResponse({
      ...user,
      role: { id: user.role.id, name: user.role.name },
      permissions,
    }),
    token,
    cookieOptions: getCookieOptions(),
  };
};

const getCurrentUser = async (authenticatedUser) => {
  const user = await prisma.user.findUnique({
    where: { id: authenticatedUser.id },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: user.roleId },
    include: { permission: true },
  });

  return buildUserResponse({
    ...user,
    role: { id: user.role.id, name: user.role.name },
    permissions: buildPermissionList(rolePermissions),
  });
};

const logout = () => ({ success: true });

module.exports = {
  login,
  getCurrentUser,
  logout,
};
