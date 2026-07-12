const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  details = null,
  extras = {},
) => {
  const payload = {
    success: false,
    message,
    details,
  };

  if (extras.code) {
    payload.code = extras.code;
  }

  if (extras.fieldErrors) {
    payload.fieldErrors = extras.fieldErrors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};
