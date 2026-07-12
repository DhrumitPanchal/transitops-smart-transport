const { sendSuccess } = require("../../common/apiResponse");
const expensesService = require("./expenses.service");
const { getRequestMeta } = require("../../utils/requestMeta");

const getExpenses = async (req, res, next) => {
  try {
    const result = await expensesService.getExpenses(req.query);
    return sendSuccess(res, result, "Expenses fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const expense = await expensesService.getExpenseById(req.params.id);
    return sendSuccess(res, expense, "Expense fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const expense = await expensesService.createExpense(
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, expense, "Expense created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await expensesService.updateExpense(
      req.params.id,
      req.body,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, expense, "Expense updated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const result = await expensesService.deleteExpense(
      req.params.id,
      req.user.id,
      getRequestMeta(req),
    );
    return sendSuccess(res, result, "Expense archived successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
