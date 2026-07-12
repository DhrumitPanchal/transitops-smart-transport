const { sendSuccess } = require("../../common/apiResponse");
const maintenanceService = require("./maintenance.service");

const getMaintenances = async (req, res, next) => {
  try {
    const result = await maintenanceService.getMaintenances(req.query);
    return sendSuccess(res, result, "Maintenances fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getMaintenanceById = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.getMaintenanceById(req.params.id);
    return sendSuccess(res, maintenance, "Maintenance fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const createMaintenance = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.createMaintenance(req.body, req.user.id);
    return sendSuccess(res, maintenance, "Maintenance created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

const updateMaintenance = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.updateMaintenance(
      req.params.id,
      req.body,
      req.user.id
    );
    return sendSuccess(res, maintenance, "Maintenance updated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const startMaintenance = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.startMaintenance(req.params.id, req.user.id);
    return sendSuccess(res, maintenance, "Maintenance started successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const completeMaintenance = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.completeMaintenance(
      req.params.id,
      req.body,
      req.user.id
    );
    return sendSuccess(res, maintenance, "Maintenance completed successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const cancelMaintenance = async (req, res, next) => {
  try {
    const maintenance = await maintenanceService.cancelMaintenance(
      req.params.id,
      req.body,
      req.user.id
    );
    return sendSuccess(res, maintenance, "Maintenance cancelled successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const deleteMaintenance = async (req, res, next) => {
  try {
    const result = await maintenanceService.deleteMaintenance(req.params.id, req.user.id);
    return sendSuccess(res, result, "Maintenance archived successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMaintenances,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
  deleteMaintenance,
};
