import * as publicStatsService from "../services/publicStats.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const getStats = asyncHandler(async (_request, response) => {
  const stats = await publicStatsService.getStats();
  response.json({ success: true, data: { stats } });
});

export { getStats };
