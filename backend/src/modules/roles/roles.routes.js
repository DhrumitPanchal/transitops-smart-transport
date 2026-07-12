const express = require("express");
const { body, param, query } = require("express-validator");
const rolesController = require("./roles.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("roles.view"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString(),
    query("sortBy").optional().isString(),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  validateMiddleware,
  rolesController.getRoles,
);

router.get(
  "/permissions",
  authMiddleware,
  permissionMiddleware("roles.view"),
  rolesController.getPermissions,
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("roles.view"),
  [param("id").isUUID()],
  validateMiddleware,
  rolesController.getRoleById,
);

router.post(
  "/",
  authMiddleware,
  permissionMiddleware("roles.create"),
  [
    body("code")
      .trim()
      .notEmpty()
      .isLength({ max: 50 })
      .matches(/^[A-Z0-9_]+$/),
    body("name").trim().isLength({ min: 3, max: 100 }),
    body("description").optional().isLength({ max: 500 }),
  ],
  validateMiddleware,
  rolesController.createRole,
);

router.put(
  "/:id",
  authMiddleware,
  permissionMiddleware("roles.edit"),
  [
    param("id").isUUID(),
    body("name").optional().trim().isLength({ min: 3, max: 100 }),
    body("description").optional().isLength({ max: 500 }),
  ],
  validateMiddleware,
  rolesController.updateRole,
);

router.put(
  "/:id/permissions",
  authMiddleware,
  permissionMiddleware("roles.permissions"),
  [param("id").isUUID(), body("permissions").isArray()],
  validateMiddleware,
  rolesController.updateRolePermissions,
);

module.exports = router;
