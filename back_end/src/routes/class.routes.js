import express from "express";
import * as classController from "../controllers/class.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
  validateAddStudent,
  validateClassId,
  validateCreateClass,
  validateStudentId,
} from "../validators/class.validator.js";

const router = express.Router();

router.use(authenticate, authorize("teacher", "admin"));
router.post("/", validateCreateClass, classController.create);
router.get("/", classController.list);
router.get("/:id/trends", validateClassId, classController.getTrends);
router.get("/:id/students", validateClassId, classController.listStudents);
router.post("/:id/students", validateClassId, validateAddStudent, classController.addStudent);
router.delete("/:id/students/:studentId", validateStudentId, classController.removeStudent);

export default router;