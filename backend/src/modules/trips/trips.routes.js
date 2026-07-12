const express = require("express");
const { param, body, query } = require("express-validator");
const tripsController = require("./trips.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("trips.view"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString(),
    query("status").optional().isIn(["DRAFT", "DISPATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
    query("vehicleId").optional().isUUID(),
    query("driverId").optional().isUUID(),
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("sortBy").optional().isString(),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  validateMiddleware,
  tripsController.getTrips
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("trips.view"),
  [param("id").isUUID()],
  validateMiddleware,
  tripsController.getTripById
);

router.post(
  "/",
  authMiddleware,
  permissionMiddleware("trips.create"),
  [
    body("vehicleId").notEmpty().isUUID(),
    body("driverId").notEmpty().isUUID(),
    body("source").notEmpty().isString(),
    body("destination").notEmpty().isString(),
    body("cargo").optional().isString(),
    body("cargoWeight").optional().isFloat({ gte: 0 }),
    body("distance").optional().isFloat({ gte: 0 }),
    body("plannedStart").notEmpty().isISO8601().toDate(),
    body("plannedEnd").notEmpty().isISO8601().toDate(),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  tripsController.createTrip
);

router.put(
  "/:id",
  authMiddleware,
  permissionMiddleware("trips.edit"),
  [
    param("id").isUUID(),
    body("vehicleId").optional().isUUID(),
    body("driverId").optional().isUUID(),
    body("source").optional().isString(),
    body("destination").optional().isString(),
    body("cargo").optional().isString(),
    body("cargoWeight").optional().isFloat({ gte: 0 }),
    body("distance").optional().isFloat({ gte: 0 }),
    body("plannedStart").optional().isISO8601().toDate(),
    body("plannedEnd").optional().isISO8601().toDate(),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  tripsController.updateTrip
);

router.patch(
  "/:id/dispatch",
  authMiddleware,
  permissionMiddleware("trips.dispatch"),
  [param("id").isUUID()],
  validateMiddleware,
  tripsController.dispatchTrip
);

router.patch(
  "/:id/start",
  authMiddleware,
  permissionMiddleware("trips.start"),
  [
    param("id").isUUID(),
    body("startOdometer").notEmpty().isFloat({ gte: 0 }),
  ],
  validateMiddleware,
  tripsController.startTrip
);

router.patch(
  "/:id/complete",
  authMiddleware,
  permissionMiddleware("trips.complete"),
  [
    param("id").isUUID(),
    body("endOdometer").notEmpty().isFloat({ gt: 0 }),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  tripsController.completeTrip
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  permissionMiddleware("trips.cancel"),
  [
    param("id").isUUID(),
    body("reason").notEmpty().isString(),
  ],
  validateMiddleware,
  tripsController.cancelTrip
);

module.exports = router;
