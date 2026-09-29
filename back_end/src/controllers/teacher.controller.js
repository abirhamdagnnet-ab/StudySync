import * as teacherService from "../services/teacher.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const getDashboardStats = asyncHandler(async (request, response) => {
  const stats = await teacherService.getDashboardStats(request.user.id);
  response.json({ success: true, data: { stats } });
});

export { getDashboardStats };