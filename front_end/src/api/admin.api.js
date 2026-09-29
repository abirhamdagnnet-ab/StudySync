import api from "./axios.js";

const getDashboardStats = async () => (await api.get("/admin/dashboard/stats")).data.data.stats;
const listUsers = async () => (await api.get("/admin/users")).data.data.users;
const createUser = async (data) => (await api.post("/admin/users", data, { suppressErrorToast: true })).data.data.user;
const updateUserStatus = async (id, is_active) => (await api.patch(`/admin/users/${id}/status`, { is_active }, { suppressErrorToast: true })).data.data.user;

export { getDashboardStats, listUsers, createUser, updateUserStatus };