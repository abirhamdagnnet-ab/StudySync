import * as questionService from "../services/question.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const canSeeAnswer = (request) => request.user.role !== "student";

const list = asyncHandler(async (request, response) => {
  const result = await questionService.listQuestions({
    ...request.query,
    includeAnswer: canSeeAnswer(request),
  });
  response.json({ success: true, data: result });
});

const listByTopic = asyncHandler(async (request, response) => {
  const result = await questionService.listQuestions({
    ...request.query,
    topicId: request.params.id,
    includeAnswer: canSeeAnswer(request),
  });
  response.json({ success: true, data: result });
});

const get = asyncHandler(async (request, response) => {
  const question = await questionService.getQuestion(request.params.id, canSeeAnswer(request));
  response.json({ success: true, data: { question } });
});

const create = asyncHandler(async (request, response) => {
  const question = await questionService.createQuestion({
    ...request.body,
    created_by: request.user.id,
  });
  response.status(201).json({ success: true, data: { question } });
});

const update = asyncHandler(async (request, response) => {
  const question = await questionService.updateQuestion(request.params.id, request.body);
  response.json({ success: true, data: { question } });
});

const remove = asyncHandler(async (request, response) => {
  await questionService.deleteQuestion(request.params.id);
  response.status(204).end();
});

export { list, listByTopic, get, create, update, remove };