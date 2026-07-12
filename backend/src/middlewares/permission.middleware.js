const AppError = require("../common/AppError");
const { ROLES } = require("../constants");

const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const userPermissions = req.user?.permissions || [];
      const roleCode = req.user?.role;

      if (
        roleCode === ROLES.SUPER_ADMIN ||
        userPermissions.includes(requiredPermission)
      ) {
        return next();
      }

      return next(
        new AppError(403, "You do not have permission to access this resource"),
      );
    } catch (error) {
      return next(new AppError(500, "Permission check failed"));
    }
  };
};

module.exports = permissionMiddleware;
