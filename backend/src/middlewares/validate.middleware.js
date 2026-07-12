const { validationResult } = require("express-validator");
const AppError = require("../common/AppError");

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError(422, "Validation failed", true, errors.array()));
  }

  return next();
};

module.exports = validateMiddleware;
