const AppError = require("../common/AppError");
const { sendError } = require("../common/apiResponse");

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  if (err.name === "ValidationError") {
    return sendError(res, "Validation failed", 400, err.message);
  }

  console.error(err);
  return sendError(res, "Internal server error", 500);
};

module.exports = errorMiddleware;
