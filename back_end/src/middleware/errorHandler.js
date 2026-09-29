import env from "../config/env.js";

const errorHandler = (error, _request, response, next) => {
  if (response.headersSent) return next(error);

  const requestedStatus = error.statusCode ?? error.status;
  const statusCode = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
    ? requestedStatus
    : 500;
  const isProduction = env.NODE_ENV === "production";

  if (statusCode >= 500) console.error(error);

  const payload = {
    success: false,
    message: isProduction && statusCode >= 500 ? "Internal server error" : error.message || "Internal server error",
  };

  if (!isProduction) payload.stack = error.stack;

  response.status(statusCode).json(payload);
};

export default errorHandler;