const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { env } = require("./config");
const { authenticateSocket } = require("./middlewares/socket.middleware");
const { handleSocketConnection } = require("./utils/socketHandler");
const { setIoInstance } = require("./utils/socketEmitter");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.corsOrigin,
    credentials: true,
  },
});

setIoInstance(io);

io.use(authenticateSocket);

io.on("connection", handleSocketConnection);

server.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

module.exports = { io, server };
