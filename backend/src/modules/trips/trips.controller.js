const { sendSuccess } = require("../../common/apiResponse");
const tripsService = require("./trips.service");
const { getRequestMeta } = require("../../utils/requestMeta");

const getTrips = async (req, res, next) => {
  try {
    const result = await tripsService.getTrips(req.query);
    return sendSuccess(res, result, "Trips fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = await tripsService.getTripById(req.params.id);
    return sendSuccess(res, trip, "Trip fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const createTrip = async (req, res, next) => {
  try {
    const trip = await tripsService.createTrip(
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, trip, "Trip created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripsService.updateTrip(
      req.params.id,
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, trip, "Trip updated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const dispatchTrip = async (req, res, next) => {
  try {
    const trip = await tripsService.dispatchTrip(
      req.params.id,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, trip, "Trip dispatched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const startTrip = async (req, res, next) => {
  try {
    const trip = await tripsService.startTrip(
      req.params.id,
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, trip, "Trip started successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const completeTrip = async (req, res, next) => {
  try {
    const trip = await tripsService.completeTrip(
      req.params.id,
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, trip, "Trip completed successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const cancelTrip = async (req, res, next) => {
  try {
    const trip = await tripsService.cancelTrip(
      req.params.id,
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, trip, "Trip cancelled successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  dispatchTrip,
  startTrip,
  completeTrip,
  cancelTrip,
};
