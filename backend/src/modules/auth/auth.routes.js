const express = require("express");
const { body } = require("express-validator");
const authController = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().trim().notEmpty(),
    body("password").isString().isLength({ min: 8, max: 100 }),
  ],
  validateMiddleware,
  authController.login,
);

router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.getCurrentUser);

module.exports = router;
