import * as aiService from "../services/ai.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const createConversation = asyncHandler(async (request, response) => {
  const conversation = await aiService.createConversation(request.user.id, request.body);
  response.status(201).json({ success: true, data: { conversation } });
});

const createConversationWithFile = asyncHandler(async (request, response) => {
  const conversation = await aiService.createConversationWithFile(request.user.id, request.body, request.file);
  response.status(201).json({ success: true, data: { conversation } });
});

const listConversations = asyncHandler(async (request, response) => {
  const conversations = await aiService.listConversations(request.user.id);
  response.json({ success: true, data: { conversations } });
});

const getConversation = asyncHandler(async (request, response) => {
  const conversation = await aiService.getConversation(request.params.id, request.user.id);
  response.json({ success: true, data: { conversation } });
});

const deleteConversation = asyncHandler(async (request, response) => {
  await aiService.deleteConversation(request.params.id, request.user.id);
  response.status(204).end();
});

const answerQuestion = asyncHandler(async (request, response) => {
  const result = await aiService.answerQuestion({
    studentId: request.user.id,
    conversationId: request.params.id,
    question: request.body.question,
  });
  response.json({ success: true, data: result });
});

const explainWeakTopic = asyncHandler(async (request, response) => {
  const result = await aiService.explainWeakTopic({
    studentId: request.user.id,
    topicId: request.params.topicId,
  });
  response.json({ success: true, data: result });
});

export { createConversation, createConversationWithFile, listConversations, getConversation, deleteConversation, answerQuestion, explainWeakTopic };
