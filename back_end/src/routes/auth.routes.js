import express from "express";
import { rateLimit } from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import authenticate from "../middleware/authenticate.js";
import { validateCredentials } from "../validators/auth.validator.js";

const router = express.Router();

const createAuthLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again later.",
    });
  },
});

router.post("/register", createAuthLimiter(), validateCredentials, authController.register);
router.post("/login", createAuthLimiter(), validateCredentials, authController.login);
router.get("/me", authenticate, authController.me);

export default router;