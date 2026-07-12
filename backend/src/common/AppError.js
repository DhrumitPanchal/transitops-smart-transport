class AppError extends Error {
  constructor(
    statusCode,
    message,
    isOperational = true,
    details = null,
    code = null,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
