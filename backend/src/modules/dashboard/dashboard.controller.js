const { sendSuccess } = require("../../common/apiResponse");
const dashboardService = require("./dashboard.service");

const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    return sendSuccess(res, summary, "Dashboard summary fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getVehicleStatusSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getVehicleStatusSummary();
    return sendSuccess(res, summary, "Vehicle status summary fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getDriverStatusSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDriverStatusSummary();
    return sendSuccess(res, summary, "Driver status summary fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getActiveTrips = async (req, res, next) => {
  try {
    const trips = await dashboardService.getActiveTrips();
    return sendSuccess(res, trips, "Active trips fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getUpcomingMaintenance = async (req, res, next) => {
  try {
    const maintenance = await dashboardService.getUpcomingMaintenance();
    return sendSuccess(res, maintenance, "Upcoming maintenance fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getFuelSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getFuelSummary(req.query);
    return sendSuccess(res, summary, "Fuel summary fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getExpenseSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getExpenseSummary(req.query);
    return sendSuccess(res, summary, "Expense summary fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getRecentActivities = async (req, res, next) => {
  try {
    const activities = await dashboardService.getRecentActivities();
    return sendSuccess(res, activities, "Recent activities fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getVehicleStatusSummary,
  getDriverStatusSummary,
  getActiveTrips,
  getUpcomingMaintenance,
  getFuelSummary,
  getExpenseSummary,
  getRecentActivities,
};
