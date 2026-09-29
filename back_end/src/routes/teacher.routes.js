import express from "express";
import { getDashboardStats } from "../controllers/teacher.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate, authorize("teacher"));
router.get("/dashboard/stats", getDashboardStats);

export default router;