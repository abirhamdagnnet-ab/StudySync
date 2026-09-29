import * as quizModel from "../models/quiz.model.js";
import { nextDifficulty, updateAbilityScore, updateStreaks } from "./adaptive.service.js";
import ApiError from "../utils/ApiError.js";

const beginTransaction = async (client) => client.query("BEGIN");

const startSession = async (studentId, topicId) => {
  const topic = await quizModel.findTopic(topicId);
  if (!topic) throw new ApiError(404, "Topic not found");
  return quizModel.createSession(studentId, topicId);
};

const getOwnedSession = async (sessionId, studentId, client, lock = false) => {
  const session = await quizModel.findSession(sessionId, studentId, client, lock);
  if (!session) throw new ApiError(404, "Quiz session not found");
  return session;
};

const getNextQuestion = async (sessionId, studentId) => {
  const session = await getOwnedSession(sessionId, studentId);
  if (session.status !== "active") throw new ApiError(409, "Quiz session is finished");

  const question = await quizModel.findNextQuestion(session);
  if (!question) {
    return {
      no_more_questions: true,
      message: "No more questions are available for this topic.",
      question: null,
    };
  }

  return { no_more_questions: false, question };
};

const submitAnswer = async (sessionId, studentId, questionId, answer) => {
  const client = await quizModel.pool.connect();
  let transactionOpen = false;

  try {
    await beginTransaction(client);
    transactionOpen = true;

    const session = await getOwnedSession(sessionId, studentId, client, true);
    if (session.status !== "active") throw new ApiError(409, "Quiz session is finished");

    const question = await quizModel.findQuestionForTopic(client, questionId, session.topic_id);
    if (!question) throw new ApiError(404, "Question not found in this session's topic");
    if (await quizModel.hasAttempt(client, session.id, question.id)) {
      throw new ApiError(409, "This question has already been answered in this session");
    }

    const isCorrect = await quizModel.answerMatches(client, answer, question.correct_answer);
    const attempt = await quizModel.insertAttempt(client, {
      sessionId: session.id,
      studentId,
      questionId: question.id,
      answer,
      isCorrect,
    });

    const streaks = updateStreaks(session, isCorrect);
    const progress = nextDifficulty(
      session.current_difficulty,
      streaks.correct_streak,
      streaks.wrong_streak,
    );
    const scoreAfterFirstAnswer = updateAbilityScore(50, isCorrect, question.difficulty);
    const scoreDelta = scoreAfterFirstAnswer - 50;

    const updatedSession = await quizModel.updateSessionProgress(
      client,
      session.id,
      studentId,
      progress,
    );
    const abilityScore = await quizModel.upsertAbilityScore(
      client,
      studentId,
      session.topic_id,
      scoreAfterFirstAnswer,
      scoreDelta,
    );

    await client.query("COMMIT");
    transactionOpen = false;
    return {
      is_correct: isCorrect,
      explanation: question.explanation,
      attempt,
      current_difficulty: updatedSession.current_difficulty,
      correct_streak: updatedSession.correct_streak,
      wrong_streak: updatedSession.wrong_streak,
      ability_score: Number(abilityScore.score),
    };
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    if (error.code === "23505") {
      throw new ApiError(409, "This question has already been answered in this session");
    }
    throw error;
  } finally {
    client.release();
  }
};

const finishSession = async (sessionId, studentId) => {
  const client = await quizModel.pool.connect();
  let transactionOpen = false;

  try {
    await beginTransaction(client);
    transactionOpen = true;

    let session = await getOwnedSession(sessionId, studentId, client, true);
    if (session.status === "active") {
      session = await quizModel.finishSession(client, session.id, studentId);
    }
    const summary = await quizModel.getSummary(client, session);

    await client.query("COMMIT");
    transactionOpen = false;
    return { session, summary };
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export { startSession, getNextQuestion, submitAnswer, finishSession };