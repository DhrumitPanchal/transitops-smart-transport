const jwt = require("jsonwebtoken");
const { env } = require("../config");

const parseCookieHeader = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || rest.length === 0) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
};

const extractSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookieHeader(socket.handshake.headers?.cookie || "");
  return cookies.transitops_token || null;
};

const authenticateSocket = (socket, next) => {
  try {
    const token = extractSocketToken(socket);

    if (!token) {
      socket.emit("unauthorized", { message: "Unauthorized" });
      return next(new Error("Authentication failed: No token provided"));
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      socket.emit("unauthorized", { message: "Unauthorized" });
      return next(new Error("Authentication failed: Invalid token payload"));
    }

    socket.user = {
      id: userId,
      email: decoded.email,
      roleId: decoded.roleId,
    };

    return next();
  } catch (error) {
    socket.emit("unauthorized", { message: "Unauthorized" });
    return next(new Error("Authentication failed: Invalid token"));
  }
};

module.exports = { authenticateSocket };
