const express = require("express");
const { query } = require("express-validator");
const dashboardController = require("./dashboard.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  permissionMiddleware("dashboard.view"),
  dashboardController.getDashboardSummary
);

router.get(
  "/vehicle-status",
  authMiddleware,
  permissionMiddleware("dashboard.view"),
  dashboardController.getVehicleStatusSummary
);

router.get(
  "/driver-status",
  authMiddleware,
  permissionMiddleware("dashboard.view"),
  dashboardController.getDriverStatusSummary
);

router.get(
  "/active-trips",
  authMiddleware,
  permissionMiddleware("dashboard.view"),
  dashboardController.getActiveTrips
);

router.get(
  "/upcoming-maintenance",
  authMiddleware,
  permissionMiddleware("dashboard.view"),
  dashboardController.getUpcomingMaintenance
);

router.get(
  "/fuel-summary",
  authMiddleware,
  permissionMiddleware("dashboard.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
  ],
  validateMiddleware,
  dashboardController.getFuelSummary
);

router.get(
  "/expense-summary",
  authMiddleware,
  permissionMiddleware("dashboard.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
  ],
  validateMiddleware,
  dashboardController.getExpenseSummary
);

router.get(
  "/recent-activities",
  authMiddleware,
  permissionMiddleware("dashboard.view"),
  dashboardController.getRecentActivities
);

module.exports = router;
