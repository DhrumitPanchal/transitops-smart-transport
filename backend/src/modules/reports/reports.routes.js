const express = require("express");
const { query } = require("express-validator");
const reportsController = require("./reports.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  permissionMiddleware("reports.view"),
  [
    query("fromDate").optional().isISO8601(),
    query("toDate").optional().isISO8601(),
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
    query("vehicleId").optional().isUUID(),
    query("vehicleType").optional().isString(),
    query("region").optional().isString(),
  ],
  validateMiddleware,
  reportsController.getReportSummary,
);

router.get(
  "/export/csv",
  authMiddleware,
  permissionMiddleware("reports.export"),
  [
    query("fromDate").optional().isISO8601(),
    query("toDate").optional().isISO8601(),
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
    query("vehicleId").optional().isUUID(),
    query("vehicleType").optional().isString(),
    query("region").optional().isString(),
  ],
  validateMiddleware,
  reportsController.exportReportCsv,
);

router.get(
  "/trips",
  authMiddleware,
  permissionMiddleware("reports.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("vehicleId").optional().isUUID(),
    query("driverId").optional().isUUID(),
    query("status").optional().isIn(["DRAFT", "DISPATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  ],
  validateMiddleware,
  reportsController.getTripReport
);

router.get(
  "/vehicles",
  authMiddleware,
  permissionMiddleware("reports.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("vehicleId").optional().isUUID(),
  ],
  validateMiddleware,
  reportsController.getVehicleReport
);

router.get(
  "/drivers",
  authMiddleware,
  permissionMiddleware("reports.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("driverId").optional().isUUID(),
  ],
  validateMiddleware,
  reportsController.getDriverReport
);

router.get(
  "/maintenance",
  authMiddleware,
  permissionMiddleware("reports.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("vehicleId").optional().isUUID(),
  ],
  validateMiddleware,
  reportsController.getMaintenanceReport
);

router.get(
  "/fuel",
  authMiddleware,
  permissionMiddleware("reports.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("vehicleId").optional().isUUID(),
  ],
  validateMiddleware,
  reportsController.getFuelReport
);

router.get(
  "/expenses",
  authMiddleware,
  permissionMiddleware("reports.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("vehicleId").optional().isUUID(),
    query("category").optional().isString(),
  ],
  validateMiddleware,
  reportsController.getExpenseReport
);

router.get(
  "/financial-summary",
  authMiddleware,
  permissionMiddleware("reports.view"),
  [
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
  ],
  validateMiddleware,
  reportsController.getFinancialSummary
);

module.exports = router;
