const getRequestMeta = (req = {}) => ({
  socketId: req.headers?.["x-socket-id"] || null,
  ipAddress: req.ip || null,
  userAgent: req.headers?.["user-agent"] || null,
});

module.exports = { getRequestMeta };
