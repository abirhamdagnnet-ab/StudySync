import ApiError from "../utils/ApiError.js";

const notFound = (request, _response, next) => {
  next(new ApiError(404, `Cannot ${request.method} ${request.originalUrl}`));
};

export default notFound;