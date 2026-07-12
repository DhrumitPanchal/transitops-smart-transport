const express = require("express");
const { param, body, query } = require("express-validator");
const vehiclesController = require("./vehicles.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("vehicles.view"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString(),
    query("status").optional().isIn(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]),
    query("type").optional().isIn(["TRUCK", "VAN", "PICKUP", "CONTAINER"]),
    query("sortBy").optional().isString(),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  validateMiddleware,
  vehiclesController.getVehicles
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("vehicles.view"),
  [param("id").isUUID()],
  validateMiddleware,
  vehiclesController.getVehicleById
);

router.post(
  "/",
  authMiddleware,
  permissionMiddleware("vehicles.create"),
  [
    body("registrationNumber").notEmpty().isString(),
    body("vehicleName").notEmpty().isString(),
    body("vehicleType").notEmpty().isIn(["TRUCK", "VAN", "PICKUP", "CONTAINER"]),
    body("capacity").notEmpty().isFloat({ gt: 0 }),
    body("manufactureYear").notEmpty().isInt(),
    body("currentOdometer").notEmpty().isFloat({ gte: 0 }),
    body("region").optional().isString(),
    body("purchaseCost").optional().isFloat({ gte: 0 }),
  ],
  validateMiddleware,
  vehiclesController.createVehicle
);

router.put(
  "/:id",
  authMiddleware,
  permissionMiddleware("vehicles.edit"),
  [
    param("id").isUUID(),
    body("registrationNumber").optional().isString(),
    body("vehicleName").optional().isString(),
    body("vehicleType").optional().isIn(["TRUCK", "VAN", "PICKUP", "CONTAINER"]),
    body("capacity").optional().isFloat({ gt: 0 }),
    body("manufactureYear").optional().isInt(),
    body("currentOdometer").optional().isFloat({ gte: 0 }),
    body("region").optional().isString(),
    body("purchaseCost").optional().isFloat({ gte: 0 }),
  ],
  validateMiddleware,
  vehiclesController.updateVehicle
);

router.patch(
  "/:id/status",
  authMiddleware,
  permissionMiddleware("vehicles.edit"),
  [
    param("id").isUUID(),
    body("status").notEmpty().isIn(["AVAILABLE", "IN_SHOP", "RETIRED"]),
  ],
  validateMiddleware,
  vehiclesController.changeVehicleStatus
);

router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware("vehicles.delete"),
  [param("id").isUUID()],
  validateMiddleware,
  vehiclesController.deleteVehicle
);

module.exports = router;
