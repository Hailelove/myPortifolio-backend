import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  createContact,
  listContacts,
  getContact,
  updateContactStatus,
  removeContact,
} from "./contact.controller.js";

import { authenticateAdmin } from "../../middleware/auth.middleware.js";

const router = Router();

// Public submission protection.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages submitted. Please try again later.",
  },
});

// Public route.
router.post("/", contactLimiter, createContact);

// All routes below require admin authentication.
router.use(authenticateAdmin);

router.get("/", listContacts);
router.get("/:id", getContact);
router.patch("/:id/status", updateContactStatus);
router.delete("/:id", removeContact);

export default router;
