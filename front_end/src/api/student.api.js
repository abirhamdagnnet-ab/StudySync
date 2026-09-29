import api from "./axios.js";

const getProgress = async () => (await api.get("/students/me/progress")).data.data;
const getWeakTopics = async () => (await api.get("/students/me/weak-topics")).data.data.topics;
const explainWeakTopic = async (topicId) => (await api.post(`/ai/explain-weak-topic/${topicId}`)).data.data;

export { getProgress, getWeakTopics, explainWeakTopic };