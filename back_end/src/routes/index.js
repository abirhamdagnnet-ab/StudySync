import express from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import subjectRoutes from "./subject.routes.js";
import topicRoutes from "./topic.routes.js";
import questionRoutes from "./question.routes.js";
import classRoutes from "./class.routes.js";
import quizRoutes from "./quiz.routes.js";
import studentRoutes from "./student.routes.js";
import aiRoutes from "./ai.routes.js";
import teacherRoutes from "./teacher.routes.js";
import publicRoutes from "./public.routes.js";

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/public", publicRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/subjects", subjectRoutes);
router.use("/topics", topicRoutes);
router.use("/questions", questionRoutes);
router.use("/teacher/classes", classRoutes);
router.use("/teacher", teacherRoutes);
router.use("/quiz", quizRoutes);
router.use("/students/me", studentRoutes);
router.use("/ai", aiRoutes);

export default router;
