const jwt = require("jsonwebtoken");
const { env } = require("../config");

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication failed: No token provided"));
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    socket.user = {
      id: decoded.id,
      email: decoded.email,
      roleId: decoded.roleId,
    };

    next();
  } catch (error) {
    next(new Error("Authentication failed: Invalid token"));
  }
};

module.exports = { authenticateSocket };
