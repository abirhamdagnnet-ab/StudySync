import api from "./axios.js";

const createConversation = async (data) => (await api.post("/ai/conversations", data)).data.data.conversation;
const createConversationWithFile = async (formData, onUploadProgress) => (await api.post("/ai/conversations/from-file", formData, {
  headers: { "Content-Type": "multipart/form-data" },
  onUploadProgress,
})).data.data.conversation;
const listConversations = async () => (await api.get("/ai/conversations")).data.data.conversations;
const getConversation = async (id) => (await api.get(`/ai/conversations/${id}`)).data.data.conversation;
const deleteConversation = async (id) => api.delete(`/ai/conversations/${id}`);
const sendMessage = async (id, question) => (await api.post(`/ai/conversations/${id}/messages`, { question })).data.data;

export { createConversation, createConversationWithFile, listConversations, getConversation, deleteConversation, sendMessage };
