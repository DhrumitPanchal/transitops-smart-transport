const express = require("express");
const { param, body, query } = require("express-validator");
const expensesController = require("./expenses.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const permissionMiddleware = require("../../middlewares/permission.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionMiddleware("expenses.view"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category").optional().isString(),
    query("vehicleId").optional().isUUID(),
    query("tripId").optional().isUUID(),
    query("fromDate").optional().isISO8601().toDate(),
    query("toDate").optional().isISO8601().toDate(),
    query("sortBy").optional().isString(),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  validateMiddleware,
  expensesController.getExpenses
);

router.get(
  "/:id",
  authMiddleware,
  permissionMiddleware("expenses.view"),
  [param("id").isUUID()],
  validateMiddleware,
  expensesController.getExpenseById
);

router.post(
  "/",
  authMiddleware,
  permissionMiddleware("expenses.create"),
  [
    body("vehicleId").optional().isUUID(),
    body("driverId").optional().isUUID(),
    body("tripId").optional().isUUID(),
    body("category").notEmpty().isString(),
    body("title").notEmpty().isString(),
    body("amount").notEmpty().isFloat({ gt: 0 }),
    body("expenseDate").notEmpty().isISO8601().toDate(),
    body("vendor").optional().isString(),
    body("paymentMethod").notEmpty().isString(),
    body("receiptUrl").optional().isString(),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  expensesController.createExpense
);

router.put(
  "/:id",
  authMiddleware,
  permissionMiddleware("expenses.edit"),
  [
    param("id").isUUID(),
    body("vehicleId").optional().isUUID(),
    body("driverId").optional().isUUID(),
    body("tripId").optional().isUUID(),
    body("category").optional().isString(),
    body("title").optional().isString(),
    body("amount").optional().isFloat({ gt: 0 }),
    body("expenseDate").optional().isISO8601().toDate(),
    body("vendor").optional().isString(),
    body("paymentMethod").optional().isString(),
    body("receiptUrl").optional().isString(),
    body("remarks").optional().isString(),
  ],
  validateMiddleware,
  expensesController.updateExpense
);

router.delete(
  "/:id",
  authMiddleware,
  permissionMiddleware("expenses.delete"),
  [param("id").isUUID()],
  validateMiddleware,
  expensesController.deleteExpense
);

module.exports = router;
