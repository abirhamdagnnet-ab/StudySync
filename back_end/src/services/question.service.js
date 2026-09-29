import * as questionModel from "../models/question.model.js";
import ApiError from "../utils/ApiError.js";

const listQuestions = (options) => questionModel.list(options);

const getQuestion = async (id, includeAnswer) => {
  const question = await questionModel.findById(id, includeAnswer);
  if (!question) throw new ApiError(404, "Question not found");
  return question;
};

const createQuestion = async (data) => {
  try {
    return await questionModel.create(data);
  } catch (error) {
    if (error.code === "23503") throw new ApiError(404, "Topic not found");
    throw error;
  }
};

const updateQuestion = async (id, data) => {
  try {
    const question = await questionModel.update(id, data);
    if (!question) throw new ApiError(404, "Question not found");
    return question;
  } catch (error) {
    if (error.code === "23503") throw new ApiError(404, "Topic not found");
    throw error;
  }
};

const deleteQuestion = async (id) => {
  try {
    const question = await questionModel.remove(id);
    if (!question) throw new ApiError(404, "Question not found");
    return question;
  } catch (error) {
    if (error.code === "23503") throw new ApiError(409, "Question is still in use");
    throw error;
  }
};

export { listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion };