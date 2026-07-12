const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  splitFullName,
  normalizeEmail,
  buildUserResponse,
  isLoginAllowedStatus,
  buildPermissionList,
} = require("./modules/auth/auth.helpers");

describe("auth.helpers", () => {
  it("splits full names into first and last", () => {
    assert.deepEqual(splitFullName("Ada Lovelace"), {
      firstName: "Ada",
      lastName: "Lovelace",
    });
    assert.deepEqual(splitFullName("Madonna"), {
      firstName: "Madonna",
      lastName: "Madonna",
    });
  });

  it("normalizes email", () => {
    assert.equal(normalizeEmail("  Admin@TransitOps.COM "), "admin@transitops.com");
  });

  it("allows ACTIVE and PENDING login statuses", () => {
    assert.equal(isLoginAllowedStatus("ACTIVE"), true);
    assert.equal(isLoginAllowedStatus("PENDING"), true);
    assert.equal(isLoginAllowedStatus("INACTIVE"), false);
  });

  it("builds user response with null role for pending users", () => {
    const response = buildUserResponse(
      {
        id: "u1",
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
        phone: null,
        status: "PENDING",
        roleId: null,
        role: null,
      },
      [],
    );

    assert.equal(response.status, "PENDING");
    assert.equal(response.role, null);
    assert.deepEqual(response.permissions, []);
  });

  it("includes role code for active users", () => {
    const response = buildUserResponse(
      {
        id: "u2",
        firstName: "Super",
        lastName: "Admin",
        email: "admin@transitops.com",
        phone: null,
        status: "ACTIVE",
        roleId: "r1",
        role: { id: "r1", code: "SUPER_ADMIN", name: "Super Admin" },
      },
      ["users.view", "dashboard.view"],
    );

    assert.equal(response.role.code, "SUPER_ADMIN");
    assert.deepEqual(response.permissions, ["users.view", "dashboard.view"]);
  });

  it("maps role permission rows to codes", () => {
    assert.deepEqual(
      buildPermissionList([
        { permission: { code: "users.view" } },
        { permission: { code: "users.create" } },
      ]),
      ["users.view", "users.create"],
    );
  });
});
