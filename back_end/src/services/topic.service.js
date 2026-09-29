import * as topicModel from "../models/topic.model.js";
import ApiError from "../utils/ApiError.js";

const listTopics = ({ subject_id: subjectId } = {}) => topicModel.list(subjectId ?? null);

const getTopic = async (id) => {
  const topic = await topicModel.findById(id);
  if (!topic) throw new ApiError(404, "Topic not found");
  return topic;
};

const createTopic = async (data) => {
  try {
    return await topicModel.create(data);
  } catch (error) {
    if (error.code === "23503") throw new ApiError(404, "Subject not found");
    if (error.code === "23505") throw new ApiError(409, "A topic with this name already exists for the subject");
    throw error;
  }
};

const updateTopic = async (id, data) => {
  try {
    const topic = await topicModel.update(id, data);
    if (!topic) throw new ApiError(404, "Topic not found");
    return topic;
  } catch (error) {
    if (error.code === "23503") throw new ApiError(404, "Subject not found");
    if (error.code === "23505") throw new ApiError(409, "A topic with this name already exists for the subject");
    throw error;
  }
};

const deleteTopic = async (id) => {
  try {
    const topic = await topicModel.remove(id);
    if (!topic) throw new ApiError(404, "Topic not found");
    return topic;
  } catch (error) {
    if (error.code === "23503") throw new ApiError(409, "Topic is still in use");
    throw error;
  }
};

export { listTopics, getTopic, createTopic, updateTopic, deleteTopic };