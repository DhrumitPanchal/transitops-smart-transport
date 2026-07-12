/**
 * Pure helpers for auth/user identity shaping (unit-tested without DB).
 */

const splitFullName = (name) => {
  const trimmed = String(name || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const buildPermissionList = (rolePermissions = []) =>
  rolePermissions
    .map((item) => item?.permission?.code)
    .filter(Boolean);

const buildUserResponse = (user, permissions = []) => {
  const role = user?.role
    ? {
        id: user.role.id,
        code: user.role.code || null,
        name: user.role.name,
      }
    : null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    status: user.status,
    roleId: user.roleId ?? role?.id ?? null,
    role,
    permissions: Array.isArray(permissions) ? permissions : [],
  };
};

const isLoginAllowedStatus = (status) =>
  status === "ACTIVE" || status === "PENDING";

module.exports = {
  splitFullName,
  normalizeEmail,
  buildPermissionList,
  buildUserResponse,
  isLoginAllowedStatus,
};
