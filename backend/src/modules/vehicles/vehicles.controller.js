const { sendSuccess } = require("../../common/apiResponse");
const vehiclesService = require("./vehicles.service");

const getVehicles = async (req, res, next) => {
  try {
    const result = await vehiclesService.getVehicles(req.query);
    return sendSuccess(res, result, "Vehicles fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await vehiclesService.getVehicleById(req.params.id);
    return sendSuccess(res, vehicle, "Vehicle fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehiclesService.createVehicle(req.body, req.user.id);
    return sendSuccess(res, vehicle, "Vehicle created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehiclesService.updateVehicle(
      req.params.id,
      req.body,
      req.user.id
    );
    return sendSuccess(res, vehicle, "Vehicle updated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const changeVehicleStatus = async (req, res, next) => {
  try {
    const vehicle = await vehiclesService.changeVehicleStatus(
      req.params.id,
      req.body.status,
      req.user.id
    );
    return sendSuccess(res, vehicle, "Vehicle status changed successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const result = await vehiclesService.deleteVehicle(req.params.id, req.user.id);
    return sendSuccess(res, result, "Vehicle archived successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  changeVehicleStatus,
  deleteVehicle,
};
