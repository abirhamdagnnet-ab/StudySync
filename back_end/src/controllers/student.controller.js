import * as progressService from "../services/progress.service.js";
import * as weakTopicService from "../services/weakTopic.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const getProgress = asyncHandler(async (request, response) => {
  const progress = await progressService.getStudentProgress(request.user.id);
  response.json({ success: true, data: progress });
});

const getWeakTopics = asyncHandler(async (request, response) => {
  const topics = await weakTopicService.getWeakTopics(request.user.id);
  response.json({ success: true, data: { topics } });
});

export { getProgress, getWeakTopics };