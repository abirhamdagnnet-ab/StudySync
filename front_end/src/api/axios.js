import axios from "axios";
import { notifyError } from "../utils/toast.js";

const TOKEN_STORAGE_KEY = "authToken";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "https://studysync-93jn.onrender.com" : "/api"),
  headers: { "Content-Type": "application/json" },
});

let redirectingToLogin = false;

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const isCredentialRequest = /\/auth\/(login|register)\/?(?:\?|$)/u.test(requestUrl);

    if (status === 401 && !isCredentialRequest) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (!redirectingToLogin && window.location.pathname !== "/login") {
        redirectingToLogin = true;
        notifyError("Session expired, please log in again");
        window.location.assign(`${import.meta.env.BASE_URL}login`);
      }
    } else if (!error.config?.suppressErrorToast) {
      const message = error.response?.data?.message || error.message || "Request failed";
      notifyError(message);
    }

    return Promise.reject(error);
  },
);

export { TOKEN_STORAGE_KEY };
export default api;
