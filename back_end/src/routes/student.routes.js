import express from "express";
import * as studentController from "../controllers/student.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate, authorize("student"));
router.get("/progress", studentController.getProgress);
router.get("/weak-topics", studentController.getWeakTopics);

export default router;