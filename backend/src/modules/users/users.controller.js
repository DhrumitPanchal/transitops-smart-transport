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

module.exports = {
  getUsers,
  getUserById,
};
