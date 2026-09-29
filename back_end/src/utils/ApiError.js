export default class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace?.(this, ApiError);
  }
}