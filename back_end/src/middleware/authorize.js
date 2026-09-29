import ApiError from "../utils/ApiError.js";

const authorize = (...allowedRoles) => (request, _response, next) => {
  if (!request.user) return next(new ApiError(401, "Authentication required"));
  if (!allowedRoles.includes(request.user.role)) {
    return next(new ApiError(403, "You are not authorized to access this resource"));
  }
  next();
};

export default authorize;