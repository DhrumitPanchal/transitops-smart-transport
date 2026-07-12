const { sendSuccess } = require("../../common/apiResponse");
const usersService = require("./users.service");
const AppError = require("../../common/AppError");

const getUsers = async (req, res, next) => {
  try {
    const result = await usersService.getUsers(req.query);
    return sendSuccess(res, result, "Users fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);

    if (!user) {
      return next(new AppError(404, "User not found."));
    }

    return sendSuccess(res, user, "User fetched successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body, req.user);
    return sendSuccess(res, user, "User created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(
      req.params.id,
      req.body,
      req.user,
    );
    return sendSuccess(res, user, "User updated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const user = await usersService.changeStatus(
      req.params.id,
      req.body.status,
      req.user,
    );
    return sendSuccess(res, user, "User status updated successfully", 200);
  } catch (error) {
    return next(error);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const user = await usersService.approveUser(
      req.params.id,
      req.body,
      req.user,
    );
    return sendSuccess(res, user, "User approved successfully", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changeStatus,
  approveUser,
};
