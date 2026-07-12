const { sendSuccess } = require("../../common/apiResponse");
const authService = require("./auth.service");

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.cookie("transitops_token", result.token, result.cookieOptions);

    return sendSuccess(
      res,
      { user: result.user },
      "Registration successful. Waiting for Super Admin approval.",
      201,
    );
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    res.cookie("transitops_token", result.token, result.cookieOptions);

    return sendSuccess(res, { user: result.user }, "Login successful", 200);
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie("transitops_token", { path: "/" });
  return sendSuccess(res, null, "Logout successful", 200);
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user);
    return sendSuccess(res, { user }, "Authenticated user fetched", 200);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};
