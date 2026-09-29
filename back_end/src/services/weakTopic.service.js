import * as analyticsModel from "../models/analytics.model.js";

const getWeakTopics = (studentId) => analyticsModel.getWeakTopicsForStudent(studentId);

export { getWeakTopics };