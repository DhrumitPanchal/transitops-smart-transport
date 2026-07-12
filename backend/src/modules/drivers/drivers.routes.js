const express = require("express");
const { param, body, query } = require("express-validator");
const driversController = require("./drivers.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("drivers.view"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString(),
    query("status").optional().isIn(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]),
    query("sortBy").optional().isString(),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  validateMiddleware,
  driversController.getDrivers
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("drivers.view"),
  [param("id").isUUID()],
  validateMiddleware,
  driversController.getDriverById
);

router.post(
  "/",
  authMiddleware,
  permissionMiddleware("drivers.create"),
  [
    body("employeeCode").notEmpty().isString(),
    body("firstName").notEmpty().isString().isLength({ min: 2, max: 100 }),
    body("lastName").notEmpty().isString().isLength({ min: 2, max: 100 }),
    body("phone").notEmpty().isString(),
    body("email").optional().isEmail(),
    body("licenseNumber").notEmpty().isString(),
    body("licenseCategory").notEmpty().isString(),
    body("licenseExpiryDate").notEmpty().isISO8601().toDate(),
    body("joiningDate").notEmpty().isISO8601().toDate(),
    body("address").optional().isString(),
    body("safetyScore").optional().isInt({ min: 0, max: 100 }),
  ],
  validateMiddleware,
  driversController.createDriver
);

router.put(
  "/:id",
  authMiddleware,
  permissionMiddleware("drivers.edit"),
  [
    param("id").isUUID(),
    body("employeeCode").optional().isString(),
    body("firstName").optional().isString().isLength({ min: 2, max: 100 }),
    body("lastName").optional().isString().isLength({ min: 2, max: 100 }),
    body("phone").optional().isString(),
    body("email").optional().isEmail(),
    body("licenseNumber").optional().isString(),
    body("licenseCategory").optional().isString(),
    body("licenseExpiryDate").optional().isISO8601().toDate(),
    body("joiningDate").optional().isISO8601().toDate(),
    body("address").optional().isString(),
    body("safetyScore").optional().isInt({ min: 0, max: 100 }),
  ],
  validateMiddleware,
  driversController.updateDriver
);

router.patch(
  "/:id/status",
  authMiddleware,
  permissionMiddleware("drivers.change_status"),
  [
    param("id").isUUID(),
    body("status").notEmpty().isIn(["AVAILABLE", "OFF_DUTY", "SUSPENDED"]),
  ],
  validateMiddleware,
  driversController.changeDriverStatus
);

router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware("drivers.delete"),
  [param("id").isUUID()],
  validateMiddleware,
  driversController.deleteDriver
);

module.exports = router;
