const log = (message, meta = {}) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[${new Date().toISOString()}] ${message}`, meta);
  }
};

const errorLog = (message, meta = {}) => {
  if (process.env.NODE_ENV !== "test") {
    console.error(`[${new Date().toISOString()}] ${message}`, meta);
  }
};

module.exports = {
  log,
  errorLog,
};
