const { sendSuccess } = require("../../common/apiResponse");
const fuelLogsService = require("./fuelLogs.service");
const { getRequestMeta } = require("../../utils/requestMeta");

const getFuelLogs = async (req, res, next) => {
  try {
    const result = await fuelLogsService.getFuelLogs(req.query);
    return sendSuccess(res, result, "Fuel logs fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getFuelLogById = async (req, res, next) => {
  try {
    const fuelLog = await fuelLogsService.getFuelLogById(req.params.id);
    return sendSuccess(res, fuelLog, "Fuel log fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const createFuelLog = async (req, res, next) => {
  try {
    const fuelLog = await fuelLogsService.createFuelLog(
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, fuelLog, "Fuel log created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

const updateFuelLog = async (req, res, next) => {
  try {
    const fuelLog = await fuelLogsService.updateFuelLog(
      req.params.id,
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, fuelLog, "Fuel log updated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const deleteFuelLog = async (req, res, next) => {
  try {
    const result = await fuelLogsService.deleteFuelLog(
      req.params.id,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, result, "Fuel log archived successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getFuelLogs,
  getFuelLogById,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
};
