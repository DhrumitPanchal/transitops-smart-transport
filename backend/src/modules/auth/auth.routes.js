const express = require("express");
const { body } = require("express-validator");
const authController = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").optional().isString().trim().isLength({ min: 2, max: 100 }),
    body("firstName")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 }),
    body("lastName")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 }),
    body("email").isEmail().normalizeEmail().trim().notEmpty(),
    body("password").isString().isLength({ min: 8, max: 100 }),
    body("confirmPassword")
      .optional()
      .isString()
      .custom((value, { req }) => {
        if (value != null && value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
  ],
  validateMiddleware,
  authController.register,
);

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
