import * as quizService from "../services/quiz.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const startSession = asyncHandler(async (request, response) => {
  const session = await quizService.startSession(request.user.id, request.body.topic_id);
  response.status(201).json({ success: true, data: { session } });
});

const nextQuestion = asyncHandler(async (request, response) => {
  const result = await quizService.getNextQuestion(request.params.id, request.user.id);
  response.status(200).json({ success: true, data: result });
});

const answer = asyncHandler(async (request, response) => {
  const result = await quizService.submitAnswer(
    request.params.id,
    request.user.id,
    request.body.question_id,
    request.body.answer,
  );
  response.status(200).json({ success: true, data: result });
});

const finish = asyncHandler(async (request, response) => {
  const result = await quizService.finishSession(request.params.id, request.user.id);
  response.status(200).json({ success: true, data: result });
});

export { startSession, nextQuestion, answer, finish };