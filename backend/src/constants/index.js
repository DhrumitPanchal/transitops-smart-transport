const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  DRIVER: "DRIVER",
  VIEWER: "VIEWER",
};

const PERMISSION_KEYS = {
  USER_VIEW: "user.view",
  USER_ADD: "user.add",
  VEHICLE_VIEW: "vehicle.view",
  VEHICLE_ADD: "vehicle.add",
  TRIP_DISPATCH: "trip.dispatch",
  TRIP_COMPLETE: "trip.complete",
  MAINTENANCE_COMPLETE: "maintenance.complete",
  REPORT_EXPORT: "report.export",
};

module.exports = {
  HTTP_STATUS,
  ROLES,
  PERMISSION_KEYS,
};
