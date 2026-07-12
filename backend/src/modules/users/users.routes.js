const express = require("express");
const { body, param, query } = require("express-validator");
const usersController = require("./users.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("users.view"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("roleId").optional().isUUID(),
    query("status").optional().isIn(["PENDING", "ACTIVE", "INACTIVE"]),
    query("search").optional().isString(),
    query("sortBy").optional().isString(),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  validateMiddleware,
  usersController.getUsers,
);

router.post(
  "/",
  authMiddleware,
  permissionMiddleware("users.create"),
  [
    body("name").optional().isString().trim().isLength({ min: 2, max: 100 }),
    body("firstName").optional().isString().trim(),
    body("lastName").optional().isString().trim(),
    body("email").isEmail().normalizeEmail().trim().notEmpty(),
    body("password").isString().isLength({ min: 8, max: 100 }),
    body("role").optional().isString().trim(),
    body("roleId").optional().isUUID(),
    body("status").optional().isIn(["ACTIVE", "INACTIVE"]),
    body("phone").optional().isString().trim(),
  ],
  validateMiddleware,
  usersController.createUser,
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("users.view"),
  [param("id").isUUID()],
  validateMiddleware,
  usersController.getUserById,
);

router.put(
  "/:id",
  authMiddleware,
  permissionMiddleware("users.edit"),
  [
    param("id").isUUID(),
    body("name").optional().isString().trim().isLength({ min: 2, max: 100 }),
    body("firstName").optional().isString().trim(),
    body("lastName").optional().isString().trim(),
    body("email").optional().isEmail().normalizeEmail().trim(),
    body("password").optional().isString().isLength({ min: 8, max: 100 }),
    body("role").optional().isString().trim(),
    body("roleId").optional().isUUID(),
    body("status").optional().isIn(["ACTIVE", "INACTIVE"]),
    body("phone").optional().isString().trim(),
  ],
  validateMiddleware,
  usersController.updateUser,
);

router.patch(
  "/:id/status",
  authMiddleware,
  permissionMiddleware("users.change_status"),
  [
    param("id").isUUID(),
    body("status").isIn(["ACTIVE", "INACTIVE"]),
  ],
  validateMiddleware,
  usersController.changeStatus,
);

router.patch(
  "/:id/approve",
  authMiddleware,
  permissionMiddleware("users.change_status"),
  [
    param("id").isUUID(),
    body("role").optional().isString().trim().notEmpty(),
    body("roleId").optional().isUUID(),
  ],
  validateMiddleware,
  usersController.approveUser,
);

module.exports = router;
