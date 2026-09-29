import api from "./axios.js";

const startSession = async (topicId) => (await api.post("/quiz/sessions", { topic_id: topicId })).data.data.session;
const getNextQuestion = async (sessionId) => (await api.get(`/quiz/sessions/${sessionId}/next-question`)).data.data;
const submitAnswer = async (sessionId, questionId, answer) => (await api.post(`/quiz/sessions/${sessionId}/answer`, { question_id: questionId, answer })).data.data;
const finishSession = async (sessionId) => (await api.post(`/quiz/sessions/${sessionId}/finish`)).data.data;

export { startSession, getNextQuestion, submitAnswer, finishSession };