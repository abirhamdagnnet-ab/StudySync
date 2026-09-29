import { consumeDailyRequest } from "../models/aiUsage.model.js";

const aiRateLimiter = async (request, response, next) => {
  try {
    const usage = await consumeDailyRequest(request.user.id);
    if (!usage) {
      return response.status(429).json({
        success: false,
        message: "You have reached your 30 AI questions for today. Please come back tomorrow.",
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default aiRateLimiter;