import * as classModel from "../models/class.model.js";
import ApiError from "../utils/ApiError.js";

const listClasses = (user) => classModel.listForTeacher(user.id, user.role === "admin");

const createClass = async (user, { name, subject_id: subjectId }) => {
  try {
    return await classModel.create({ name, subjectId, teacherId: user.id });
  } catch (error) {
    if (error.code === "23503") throw new ApiError(404, "Subject not found");
    throw error;
  }
};

const listStudents = async (user, classId) => {
  const classroom = await classModel.findAccessibleById(classId, user.id, user.role === "admin");
  if (!classroom) throw new ApiError(404, "Class not found");
  return classModel.listStudents(classId);
};

const addStudent = async (user, classId, email) => {
  const isAdmin = user.role === "admin";
  const classroom = await classModel.findAccessibleById(classId, user.id, isAdmin);
  if (!classroom) throw new ApiError(404, "Class not found");

  const enrollment = await classModel.addStudentByEmail(classId, email);
  if (enrollment) return enrollment;

  const student = await classModel.findUserByEmail(email);
  if (!student || student.role !== "student" || !student.is_active) {
    throw new ApiError(404, "Active student not found");
  }

  throw new ApiError(409, "Student is already enrolled in this class");
};

const removeStudent = async (user, classId, studentId) => {
  const isAdmin = user.role === "admin";
  const classroom = await classModel.findAccessibleById(classId, user.id, isAdmin);
  if (!classroom) throw new ApiError(404, "Class not found");

  const enrollment = await classModel.removeStudent(classId, studentId);
  if (!enrollment) throw new ApiError(404, "Student is not enrolled in this class");
  return enrollment;
};

export { listClasses, createClass, listStudents, addStudent, removeStudent };