const express = require("express");
const { param, query } = require("express-validator");
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
    query("status").optional().isIn(["ACTIVE", "INACTIVE"]),
  ],
  validateMiddleware,
  usersController.getUsers,
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("users.view"),
  [param("id").isUUID()],
  validateMiddleware,
  usersController.getUserById,
);

module.exports = router;
