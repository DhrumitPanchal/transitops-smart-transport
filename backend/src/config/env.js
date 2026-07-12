const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "transitops-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
