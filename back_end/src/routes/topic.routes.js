import express from "express";
import * as questionController from "../controllers/question.controller.js";
import * as topicController from "../controllers/topic.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
  validateId,
  validateQuestionListQuery,
  validateTopic,
  validateTopicListQuery,
} from "../validators/content.validator.js";

const router = express.Router();

router.use(authenticate);
router.get("/", validateTopicListQuery, topicController.list);
router.get("/:id/questions", validateId, validateQuestionListQuery, questionController.listByTopic);
router.get("/:id", validateId, topicController.get);
router.post("/", authorize("teacher", "admin"), validateTopic, topicController.create);
router.put("/:id", authorize("admin"), validateId, validateTopic, topicController.update);
router.delete("/:id", authorize("admin"), validateId, topicController.remove);

export default router;