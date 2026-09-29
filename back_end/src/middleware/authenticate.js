import * as userModel from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verify } from "../utils/jwt.js";

const authenticate = asyncHandler(async (request, _response, next) => {
  const authorization = request.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new ApiError(401, "Authentication required");
  }

  let payload;
  try {
    payload = verify(token);
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await userModel.findById(payload.sub);
  if (!user || !user.is_active) {
    throw new ApiError(401, "Invalid or expired token");
  }

  request.user = { id: user.id, role: user.role };
  next();
});

export default authenticate;