import { checkDatabase } from "../services/health.service.js";

const getHealth = async (_request, response) => {
  try {
    await checkDatabase();
    response.status(200).json({ status: "ok", database: "connected" });
  } catch (_error) {
    response.status(503).json({ status: "error", database: "disconnected" });
  }
};

export { getHealth };