import api from "./axios.js";

const listSubjects = async () => (await api.get("/subjects")).data.data.subjects;
const createSubject = async (data) => (await api.post("/subjects", data, { suppressErrorToast: true })).data.data.subject;
const updateSubject = async (id, data) => (await api.put(`/subjects/${id}`, data, { suppressErrorToast: true })).data.data.subject;
const deleteSubject = async (id) => api.delete(`/subjects/${id}`, { suppressErrorToast: true });

const listTopics = async (params = {}) => (await api.get("/topics", { params })).data.data.topics;
const createTopic = async (data) => (await api.post("/topics", data, { suppressErrorToast: true })).data.data.topic;
const updateTopic = async (id, data) => (await api.put(`/topics/${id}`, data, { suppressErrorToast: true })).data.data.topic;
const deleteTopic = async (id) => api.delete(`/topics/${id}`, { suppressErrorToast: true });

const listQuestions = async (params = {}) => (await api.get("/questions", { params })).data.data;
const listTopicQuestions = async (topicId, params = {}) => (await api.get(`/topics/${topicId}/questions`, { params })).data.data;
const createQuestion = async (data) => (await api.post("/questions", data, { suppressErrorToast: true })).data.data.question;
const updateQuestion = async (id, data) => (await api.put(`/questions/${id}`, data, { suppressErrorToast: true })).data.data.question;
const deleteQuestion = async (id) => api.delete(`/questions/${id}`, { suppressErrorToast: true });

export {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  listQuestions,
  listTopicQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};