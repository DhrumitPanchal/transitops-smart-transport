const { PrismaClient } = require("../../generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { env } = require("../config");

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLE_ROOMS = {
  "Super Admin": "admin",
  "Fleet Manager": "fleet-manager",
  "Dispatcher": "dispatcher",
  "Financial Analyst": "finance",
  "Safety Officer": "safety",
};

const handleSocketConnection = async (socket) => {
  const userId = socket.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      socket.emit("unauthorized", { message: "Unauthorized" });
      socket.emit("socket.error", { message: "User not found" });
      socket.disconnect();
      return;
    }

    if (user.status !== "ACTIVE") {
      socket.emit("unauthorized", { message: "Unauthorized" });
      socket.emit("socket.error", { message: "Account is inactive" });
      socket.disconnect();
      return;
    }

    const roleRoom = ROLE_ROOMS[user.role.name];
    if (roleRoom) {
      socket.join(roleRoom);
    }

    socket.join(`user:${userId}`);

    console.log(`User ${userId} connected. Rooms: ${roleRoom || "none"}, user:${userId}`);

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  } catch (error) {
    console.error("Socket connection error:", error);
    socket.emit("socket.error", { message: "Connection failed" });
    socket.disconnect();
  }
};

module.exports = { handleSocketConnection };
