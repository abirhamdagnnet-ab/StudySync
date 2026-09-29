function authErrorMessage(error, action) {
  const serverMessage = error.response?.data?.message;
  if (serverMessage) return serverMessage;

  if (!error.response) {
    return "Can’t reach the API. Check that the backend is running, VITE_API_URL is correct, and CORS_ORIGIN allows the frontend.";
  }

  return `Unable to ${action} (HTTP ${error.response.status}). Please try again.`;
}

export default authErrorMessage;
