import * as questionModel from "../models/question.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const ownership = asyncHandler(async (request, _response, next) => {
  if (request.user.role === "admin") return next();

  const question = await questionModel.findById(request.params.id, false, true);
  if (!question) throw new ApiError(404, "Question not found");
  if (String(question.created_by) !== String(request.user.id)) {
    throw new ApiError(403, "You can only change questions you created");
  }

  next();
});

export default ownership;