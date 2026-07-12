const crypto = require("crypto");

let ioInstance = null;

const ROLE_ROOMS = {
  "Super Admin": "admin",
  "Fleet Manager": "fleet-manager",
  Dispatcher: "dispatcher",
  "Financial Analyst": "finance",
  "Safety Officer": "safety",
};

const setIoInstance = (io) => {
  ioInstance = io;
};

const getIoInstance = () => ioInstance;

const isDecimalLike = (value) => {
  if (!value || typeof value !== "object") return false;
  if (typeof value.toNumber === "function") return true;
  return value.constructor?.name === "Decimal";
};

const serializeValue = (value) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (isDecimalLike(value)) return Number(value);
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeValue(nested)]),
    );
  }
  return value;
};

const buildEnvelope = ({
  actorUserId = null,
  data = {},
  dashboardChanges = null,
} = {}) => {
  const envelope = {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    actorUserId,
    data: serializeValue(data),
  };

  if (dashboardChanges && typeof dashboardChanges === "object") {
    envelope.dashboardChanges = dashboardChanges;
  }

  return envelope;
};

const resolveTarget = (excludeSocketId) => {
  if (!ioInstance) return null;
  if (excludeSocketId) {
    return ioInstance.except(excludeSocketId);
  }
  return ioInstance;
};

/**
 * Emit a domain event with the frontend-compatible envelope.
 * Prefer this over raw emitTo* helpers for business events.
 */
const emitDomainEvent = (
  event,
  { actorUserId, data, dashboardChanges, excludeSocketId, rooms } = {},
) => {
  const target = resolveTarget(excludeSocketId);
  if (!target) return null;

  const envelope = buildEnvelope({ actorUserId, data, dashboardChanges });

  if (Array.isArray(rooms) && rooms.length > 0) {
    rooms.forEach((room) => {
      target.to(room).emit(event, envelope);
    });
  } else {
    target.emit(event, envelope);
  }

  return envelope;
};

const emitToAll = (event, data, options = {}) => {
  if (data && typeof data === "object" && data.eventId && data.data) {
    const target = resolveTarget(options.excludeSocketId);
    if (target) target.emit(event, data);
    return data;
  }

  return emitDomainEvent(event, {
    actorUserId: options.actorUserId,
    data,
    dashboardChanges: options.dashboardChanges,
    excludeSocketId: options.excludeSocketId,
  });
};

const emitToRoom = (room, event, data, options = {}) => {
  return emitDomainEvent(event, {
    actorUserId: options.actorUserId,
    data,
    dashboardChanges: options.dashboardChanges,
    excludeSocketId: options.excludeSocketId,
    rooms: [room],
  });
};

const emitToUser = (userId, event, data, options = {}) => {
  return emitDomainEvent(event, {
    actorUserId: options.actorUserId,
    data,
    dashboardChanges: options.dashboardChanges,
    excludeSocketId: options.excludeSocketId,
    rooms: [`user:${userId}`],
  });
};

const emitToRole = (role, event, data, options = {}) => {
  const room = ROLE_ROOMS[role];
  if (!room) return null;

  return emitDomainEvent(event, {
    actorUserId: options.actorUserId,
    data,
    dashboardChanges: options.dashboardChanges,
    excludeSocketId: options.excludeSocketId,
    rooms: [room],
  });
};

module.exports = {
  setIoInstance,
  getIoInstance,
  serializeValue,
  buildEnvelope,
  emitDomainEvent,
  emitToAll,
  emitToRoom,
  emitToUser,
  emitToRole,
  ROLE_ROOMS,
};
