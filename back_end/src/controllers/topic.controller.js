import * as topicService from "../services/topic.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const list = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { topics: await topicService.listTopics(request.query) } });
});

const get = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { topic: await topicService.getTopic(request.params.id) } });
});

const create = asyncHandler(async (request, response) => {
  const topic = await topicService.createTopic(request.body);
  response.status(201).json({ success: true, data: { topic } });
});

const update = asyncHandler(async (request, response) => {
  const topic = await topicService.updateTopic(request.params.id, request.body);
  response.json({ success: true, data: { topic } });
});

const remove = asyncHandler(async (request, response) => {
  await topicService.deleteTopic(request.params.id);
  response.status(204).end();
});

export { list, get, create, update, remove };