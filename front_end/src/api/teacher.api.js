import api from "./axios.js";

const getDashboardStats = async () => (await api.get("/teacher/dashboard/stats")).data.data.stats;
const listClasses = async () => (await api.get("/teacher/classes")).data.data.classes;
const createClass = async (data) => (await api.post("/teacher/classes", data, { suppressErrorToast: true })).data.data.class;
const listClassStudents = async (classId) => (await api.get(`/teacher/classes/${classId}/students`)).data.data.students;
const addStudent = async (classId, email) => (await api.post(`/teacher/classes/${classId}/students`, { email }, { suppressErrorToast: true })).data.data.enrollment;
const removeStudent = async (classId, studentId) => api.delete(`/teacher/classes/${classId}/students/${studentId}`, { suppressErrorToast: true });
const getClassTrends = async (classId) => (await api.get(`/teacher/classes/${classId}/trends`)).data.data.topics;

export { getDashboardStats, listClasses, createClass, listClassStudents, addStudent, removeStudent, getClassTrends };