import express from "express";
import * as questionController from "../controllers/question.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import ownership from "../middleware/ownership.js";
import {
  validateId,
  validateQuestion,
  validateQuestionListQuery,
} from "../validators/content.validator.js";

const router = express.Router();

router.use(authenticate);
router.get("/", validateQuestionListQuery, questionController.list);
router.get("/:id", validateId, questionController.get);
router.post("/", authorize("teacher", "admin"), validateQuestion, questionController.create);
router.put(
  "/:id",
  authorize("teacher", "admin"),
  validateId,
  ownership,
  validateQuestion,
  questionController.update,
);
router.delete("/:id", authorize("teacher", "admin"), validateId, ownership, questionController.remove);

export default router;