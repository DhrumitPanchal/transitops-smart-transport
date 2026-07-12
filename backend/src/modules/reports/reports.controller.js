const { sendSuccess } = require("../../common/apiResponse");
const reportsService = require("./reports.service");

const getTripReport = async (req, res, next) => {
  try {
    const report = await reportsService.getTripReport(req.query);
    return sendSuccess(res, report, "Trip report generated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getVehicleReport = async (req, res, next) => {
  try {
    const report = await reportsService.getVehicleReport(req.query);
    return sendSuccess(res, report, "Vehicle report generated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getDriverReport = async (req, res, next) => {
  try {
    const report = await reportsService.getDriverReport(req.query);
    return sendSuccess(res, report, "Driver report generated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getMaintenanceReport = async (req, res, next) => {
  try {
    const report = await reportsService.getMaintenanceReport(req.query);
    return sendSuccess(res, report, "Maintenance report generated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getFuelReport = async (req, res, next) => {
  try {
    const report = await reportsService.getFuelReport(req.query);
    return sendSuccess(res, report, "Fuel report generated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getExpenseReport = async (req, res, next) => {
  try {
    const report = await reportsService.getExpenseReport(req.query);
    return sendSuccess(res, report, "Expense report generated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getFinancialSummary = async (req, res, next) => {
  try {
    const summary = await reportsService.getFinancialSummary(req.query);
    return sendSuccess(res, summary, "Financial summary generated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTripReport,
  getVehicleReport,
  getDriverReport,
  getMaintenanceReport,
  getFuelReport,
  getExpenseReport,
  getFinancialSummary,
};
