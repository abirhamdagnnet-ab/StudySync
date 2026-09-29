import * as analyticsModel from "../models/analytics.model.js";
import ApiError from "../utils/ApiError.js";

const getClassTrends = async (classId, user) => {
  const isAdmin = user.role === "admin";
  const classroom = await analyticsModel.findAccessibleClass(classId, user.id, isAdmin);
  if (!classroom) throw new ApiError(404, "Class not found");

  return analyticsModel.getClassTopicTrends(classId);
};

export { getClassTrends };