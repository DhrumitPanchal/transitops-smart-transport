const { sendSuccess } = require("../../common/apiResponse");
const rolesService = require("./roles.service");
const AppError = require("../../common/AppError");

const getRoles = async (req, res, next) => {
  try {
    const roles = await rolesService.getRoles(req.query);
    return sendSuccess(res, roles, "Roles fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await rolesService.getRoleById(req.params.id);

    if (!role) {
      return next(new AppError(404, "Role not found."));
    }

    return sendSuccess(res, role, "Role fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const permissions = await rolesService.getPermissions();
    return sendSuccess(res, permissions, "Permissions fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const role = await rolesService.createRole(req.body, {
      id: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return sendSuccess(res, role, "Role created successfully.", 201);
  } catch (error) {
    if (error.statusCode) {
      return next(new AppError(error.statusCode, error.message));
    }

    return next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await rolesService.updateRole(
      { id: req.params.id, ...req.body },
      {
        id: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    );

    return sendSuccess(res, role, "Role updated successfully.", 200);
  } catch (error) {
    if (error.statusCode) {
      return next(new AppError(error.statusCode, error.message));
    }

    return next(error);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    await rolesService.updateRolePermissions(
      { id: req.params.id, ...req.body },
      {
        id: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    );

    return sendSuccess(res, null, "Permissions updated successfully.", 200);
  } catch (error) {
    if (error.statusCode) {
      return next(new AppError(error.statusCode, error.message));
    }

    return next(error);
  }
};

module.exports = {
  getRoles,
  getRoleById,
  getPermissions,
  createRole,
  updateRole,
  updateRolePermissions,
};
