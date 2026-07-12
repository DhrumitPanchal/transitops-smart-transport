const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const usersRoutes = require("../modules/users/users.routes");
const rolesRoutes = require("../modules/roles/roles.routes");
const vehiclesRoutes = require("../modules/vehicles/vehicles.routes");
const driversRoutes = require("../modules/drivers/drivers.routes");
const tripsRoutes = require("../modules/trips/trips.routes");
const maintenanceRoutes = require("../modules/maintenance/maintenance.routes");
const fuelLogsRoutes = require("../modules/fuelLogs/fuelLogs.routes");
const expensesRoutes = require("../modules/expenses/expenses.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const reportsRoutes = require("../modules/reports/reports.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/drivers", driversRoutes);
router.use("/trips", tripsRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/fuel-logs", fuelLogsRoutes);
router.use("/expenses", expensesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportsRoutes);

module.exports = router;
