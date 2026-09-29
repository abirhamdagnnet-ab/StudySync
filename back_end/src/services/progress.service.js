import * as analyticsModel from "../models/analytics.model.js";

const getStudentProgress = (studentId) => analyticsModel.getProgressForStudent(studentId);

export { getStudentProgress };