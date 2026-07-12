const express = require("express");
const { param, body, query } = require("express-validator");
const maintenanceController = require("./maintenance.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("maintenance.view"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("vehicleId").optional().isUUID(),
    query("type").optional().isIn([
      "PREVENTIVE",
      "CORRECTIVE",
      "INSPECTION",
      "OIL_CHANGE",
      "TIRE_SERVICE",
      "ENGINE_REPAIR",
      "BRAKE_SERVICE",
      "OTHER",
    ]),
    query("status").optional().isIn(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("sortBy").optional().isString(),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  validateMiddleware,
  maintenanceController.getMaintenances
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("maintenance.view"),
  [param("id").isUUID()],
  validateMiddleware,
  maintenanceController.getMaintenanceById
);

router.post(
  "/",
  authMiddleware,
  permissionMiddleware("maintenance.create"),
  [
    body("vehicleId").notEmpty().isUUID(),
    body("type").notEmpty().isIn([
      "PREVENTIVE",
      "CORRECTIVE",
      "INSPECTION",
      "OIL_CHANGE",
      "TIRE_SERVICE",
      "ENGINE_REPAIR",
      "BRAKE_SERVICE",
      "OTHER",
    ]),
    body("title").notEmpty().isString(),
    body("description").optional().isString(),
    body("serviceCenter").notEmpty().isString(),
    body("scheduledDate").notEmpty().isISO8601().toDate(),
    body("estimatedCost").optional().isFloat({ gte: 0 }),
    body("currentOdometer").notEmpty().isFloat({ gte: 0 }),
    body("nextServiceOdometer").optional().isFloat({ gte: 0 }),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  maintenanceController.createMaintenance
);

router.put(
  "/:id",
  authMiddleware,
  permissionMiddleware("maintenance.edit"),
  [
    param("id").isUUID(),
    body("vehicleId").optional().isUUID(),
    body("type").optional().isIn([
      "PREVENTIVE",
      "CORRECTIVE",
      "INSPECTION",
      "OIL_CHANGE",
      "TIRE_SERVICE",
      "ENGINE_REPAIR",
      "BRAKE_SERVICE",
      "OTHER",
    ]),
    body("title").optional().isString(),
    body("description").optional().isString(),
    body("serviceCenter").optional().isString(),
    body("scheduledDate").optional().isISO8601().toDate(),
    body("completedDate").optional().isISO8601().toDate(),
    body("estimatedCost").optional().isFloat({ gte: 0 }),
    body("actualCost").optional().isFloat({ gte: 0 }),
    body("currentOdometer").optional().isFloat({ gte: 0 }),
    body("nextServiceOdometer").optional().isFloat({ gte: 0 }),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  maintenanceController.updateMaintenance
);

router.patch(
  "/:id/start",
  authMiddleware,
  permissionMiddleware("maintenance.edit"),
  [param("id").isUUID()],
  validateMiddleware,
  maintenanceController.startMaintenance
);

router.patch(
  "/:id/complete",
  authMiddleware,
  permissionMiddleware("maintenance.complete"),
  [
    param("id").isUUID(),
    body("actualCost").notEmpty().isFloat({ gte: 0 }),
    body("completedDate").notEmpty().isISO8601().toDate(),
    body("nextServiceOdometer").optional().isFloat({ gte: 0 }),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  maintenanceController.completeMaintenance
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  permissionMiddleware("maintenance.edit"),
  [
    param("id").isUUID(),
    body("reason").notEmpty().isString(),
  ],
  validateMiddleware,
  maintenanceController.cancelMaintenance
);

router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware("maintenance.delete"),
  [param("id").isUUID()],
  validateMiddleware,
  maintenanceController.deleteMaintenance
);

module.exports = router;
