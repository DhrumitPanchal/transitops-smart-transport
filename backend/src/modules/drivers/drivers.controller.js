const { sendSuccess } = require("../../common/apiResponse");
const driversService = require("./drivers.service");

const getDrivers = async (req, res, next) => {
  try {
    const result = await driversService.getDrivers(req.query);
    return sendSuccess(res, result, "Drivers fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getDriverById = async (req, res, next) => {
  try {
    const driver = await driversService.getDriverById(req.params.id);
    return sendSuccess(res, driver, "Driver fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const createDriver = async (req, res, next) => {
  try {
    const driver = await driversService.createDriver(req.body, req.user.id);
    return sendSuccess(res, driver, "Driver created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const driver = await driversService.updateDriver(
      req.params.id,
      req.body,
      req.user.id
    );
    return sendSuccess(res, driver, "Driver updated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const changeDriverStatus = async (req, res, next) => {
  try {
    const driver = await driversService.changeDriverStatus(
      req.params.id,
      req.body.status,
      req.user.id
    );
    return sendSuccess(res, driver, "Driver status changed successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const deleteDriver = async (req, res, next) => {
  try {
    const result = await driversService.deleteDriver(req.params.id, req.user.id);
    return sendSuccess(res, result, "Driver archived successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  changeDriverStatus,
  deleteDriver,
};
