import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authController } from "./auth.controller.js";
import { loginSchema, setupAdminSchema } from "./auth.validation.js";

import { validateBody } from "../../middleware/validate.middleware.js";
import { authenticateAdmin } from "../../middleware/auth.middleware.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.post(
  "/setup",
  setupLimiter,
  validateBody(setupAdminSchema),
  authController.setup,
);

router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  authController.login,
);

router.post("/logout", authenticateAdmin, authController.logout);

router.get("/me", authenticateAdmin, authController.me);

export default router;
