import api from "./axios.js";

const getPublicStats = async () => (await api.get("/public/stats", { suppressErrorToast: true })).data.data.stats;

export { getPublicStats };
