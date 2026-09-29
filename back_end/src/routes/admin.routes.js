import express from "express";
import * as adminController from "../controllers/admin.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
  validateCreateUser,
  validateUpdateStatus,
  validateUserId,
} from "../validators/admin.validator.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));
router.get("/dashboard/stats", adminController.getDashboardStats);
router.post("/users", validateCreateUser, adminController.createUser);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/status", validateUserId, validateUpdateStatus, adminController.updateStatus);

export default router;