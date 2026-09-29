import express from "express";
import * as quizController from "../controllers/quiz.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
  validateAnswer,
  validateSessionId,
  validateStartSession,
} from "../validators/quiz.validator.js";

const router = express.Router();

router.use(authenticate, authorize("student"));
router.post("/sessions", validateStartSession, quizController.startSession);
router.get("/sessions/:id/next-question", validateSessionId, quizController.nextQuestion);
router.post("/sessions/:id/answer", validateSessionId, validateAnswer, quizController.answer);
router.post("/sessions/:id/finish", validateSessionId, quizController.finish);

export default router;