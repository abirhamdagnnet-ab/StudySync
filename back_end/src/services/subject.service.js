import * as subjectModel from "../models/subject.model.js";
import ApiError from "../utils/ApiError.js";

const listSubjects = () => subjectModel.list();

const getSubject = async (id) => {
  const subject = await subjectModel.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");
  return subject;
};

const createSubject = async (data) => {
  try {
    return await subjectModel.create(data);
  } catch (error) {
    if (error.code === "23505") throw new ApiError(409, "A subject with this name already exists");
    throw error;
  }
};

const updateSubject = async (id, data) => {
  try {
    const subject = await subjectModel.update(id, data);
    if (!subject) throw new ApiError(404, "Subject not found");
    return subject;
  } catch (error) {
    if (error.code === "23505") throw new ApiError(409, "A subject with this name already exists");
    throw error;
  }
};

const deleteSubject = async (id) => {
  try {
    const subject = await subjectModel.remove(id);
    if (!subject) throw new ApiError(404, "Subject not found");
    return subject;
  } catch (error) {
    if (error.code === "23503") throw new ApiError(409, "Subject is still in use");
    throw error;
  }
};

export { listSubjects, getSubject, createSubject, updateSubject, deleteSubject };