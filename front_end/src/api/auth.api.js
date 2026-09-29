import api from "./axios.js";

const register = async (credentials) => {
  const response = await api.post("/auth/register", credentials, { suppressErrorToast: true });
  return response.data.data;
};

const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials, { suppressErrorToast: true });
  return response.data.data;
};

const me = async () => {
  const response = await api.get("/auth/me");
  return response.data.data.user;
};

export { register, login, me };