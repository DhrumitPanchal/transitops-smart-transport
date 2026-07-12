require("dotenv").config();

const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../config");
const { PrismaClient } = require("../../generated/prisma");
const AppError = require("../common/AppError");
const { buildPermissionList } = require("../modules/auth/auth.helpers");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const authMiddleware = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.transitops_token;
    const authHeader = req.headers.authorization;
    const token =
      cookieToken ||
      (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!token) {
      return next(new AppError(401, "Authentication required."));
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      return next(new AppError(404, "User not found."));
    }

    if (user.status === "INACTIVE") {
      return next(
        new AppError(
          403,
          "Your account is inactive.",
          true,
          null,
          "USER_INACTIVE",
        ),
      );
    }

    if (user.status !== "ACTIVE" && user.status !== "PENDING") {
      return next(
        new AppError(
          403,
          "Your account is inactive.",
          true,
          null,
          "USER_INACTIVE",
        ),
      );
    }

    let permissions = [];
    if (user.roleId) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permission: true },
      });
      permissions = buildPermissionList(rolePermissions);
    }

    req.user = {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role?.code || null,
      roleName: user.role?.name || null,
      roleId: user.roleId,
      permissions,
    };

    return next();
  } catch (error) {
    return next(new AppError(401, "Invalid or expired session."));
  }
};

module.exports = authMiddleware;
