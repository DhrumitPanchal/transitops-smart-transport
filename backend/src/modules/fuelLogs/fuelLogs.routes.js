const express = require("express");
const { param, body, query } = require("express-validator");
const fuelLogsController = require("./fuelLogs.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("fuel.view"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("vehicleId").optional().isUUID(),
    query("driverId").optional().isUUID(),
    query("tripId").optional().isUUID(),
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("sortBy").optional().isString(),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  validateMiddleware,
  fuelLogsController.getFuelLogs
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("fuel.view"),
  [param("id").isUUID()],
  validateMiddleware,
  fuelLogsController.getFuelLogById
);

router.post(
  "/",
  authMiddleware,
  permissionMiddleware("fuel.create"),
  [
    body("vehicleId").notEmpty().isUUID(),
    body("driverId").notEmpty().isUUID(),
    body("tripId").optional().isUUID(),
    body("fuelStation").notEmpty().isString(),
    body("fuelType").notEmpty().isString(),
    body("quantity").notEmpty().isFloat({ gt: 0 }),
    body("pricePerUnit").notEmpty().isFloat({ gt: 0 }),
    body("odometerReading").notEmpty().isFloat({ gte: 0 }),
    body("fuelDate").notEmpty().isISO8601().toDate(),
    body("receiptNumber").optional().isString(),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  fuelLogsController.createFuelLog
);

router.put(
  "/:id",
  authMiddleware,
  permissionMiddleware("fuel.edit"),
  [
    param("id").isUUID(),
    body("vehicleId").optional().isUUID(),
    body("driverId").optional().isUUID(),
    body("tripId").optional().isUUID(),
    body("fuelStation").optional().isString(),
    body("fuelType").optional().isString(),
    body("quantity").optional().isFloat({ gt: 0 }),
    body("pricePerUnit").optional().isFloat({ gt: 0 }),
    body("odometerReading").optional().isFloat({ gte: 0 }),
    body("fuelDate").optional().isISO8601().toDate(),
    body("receiptNumber").optional().isString(),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  fuelLogsController.updateFuelLog
);

router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware("fuel.delete"),
  [param("id").isUUID()],
  validateMiddleware,
  fuelLogsController.deleteFuelLog
);

module.exports = router;
