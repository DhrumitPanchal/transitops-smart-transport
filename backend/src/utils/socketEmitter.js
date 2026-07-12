let ioInstance = null;

const setIoInstance = (io) => {
  ioInstance = io;
};

const emitToAll = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

const emitToRoom = (room, event, data) => {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
};

const emitToRole = (role, event, data) => {
  const roleRooms = {
    "Super Admin": "admin",
    "Fleet Manager": "fleet-manager",
    "Dispatcher": "dispatcher",
    "Financial Analyst": "finance",
    "Safety Officer": "safety",
  };

  const room = roleRooms[role];
  if (room && ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
};

module.exports = {
  setIoInstance,
  emitToAll,
  emitToRoom,
  emitToUser,
  emitToRole,
};
