const AppError = require("../common/AppError");
const { sendError } = require("../common/apiResponse");

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof AppError) {
    const fieldErrors =
      err.details &&
      typeof err.details === "object" &&
      !Array.isArray(err.details)
        ? err.details
        : null;

    return sendError(res, err.message, err.statusCode, err.details, {
      code: err.code || undefined,
      fieldErrors: fieldErrors || undefined,
    });
  }

  if (err.name === "ValidationError") {
    return sendError(res, "Validation failed", 400, err.message);
  }

  console.error(err);
  return sendError(res, "Internal server error", 500);
};

module.exports = errorMiddleware;
