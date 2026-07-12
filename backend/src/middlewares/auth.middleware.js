const jwt = require("jsonwebtoken");
const { env } = require("../config");
const AppError = require("../common/AppError");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError(401, "Authentication token is required"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError(401, "Invalid or expired token"));
  }
};

module.exports = authMiddleware;
