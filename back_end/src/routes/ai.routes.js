import express from "express";
import * as aiController from "../controllers/ai.controller.js";
import aiRateLimiter from "../middleware/aiRateLimiter.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import { cleanupUploadedFileOnError, uploadAttachment } from "../middleware/upload.js";
import {
  validateConversation,
  validateUploadedConversation,
  validateConversationId,
  validateMessage,
  validateTopicId,
} from "../validators/ai.validator.js";

const router = express.Router();

const limitQuestionRequests = (request, response, next) =>
  request.body.question ? aiRateLimiter(request, response, next) : next();
router.use(authenticate, authorize("student"));
router.post("/conversations", validateConversation, limitQuestionRequests, aiController.createConversation);
router.post("/conversations/from-file", uploadAttachment, validateUploadedConversation, aiController.createConversationWithFile);
router.get("/conversations", aiController.listConversations);
router.get("/conversations/:id", validateConversationId, aiController.getConversation);
router.delete("/conversations/:id", validateConversationId, aiController.deleteConversation);
router.post(
  "/conversations/:id/messages",
  validateConversationId,
  validateMessage,
  aiRateLimiter,
  aiController.answerQuestion,
);
router.use(cleanupUploadedFileOnError);
router.post(
  "/explain-weak-topic/:topicId",
  validateTopicId,
  aiRateLimiter,
  aiController.explainWeakTopic,
);

export default router;
