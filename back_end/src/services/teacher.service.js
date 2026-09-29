import * as teacherDashboardModel from "../models/teacherDashboard.model.js";

const getDashboardStats = (teacherId) => teacherDashboardModel.getStats(teacherId);

export { getDashboardStats };