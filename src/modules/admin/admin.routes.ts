import { Router } from "express";

import {
  createAdmin,
  listAdmins,
  getAdmin,
  editAdmin,
  changeAdminRole,
  changeAdminStatus,
  removeAdmin,
} from "./admin.controller.js";

import {
  authenticateAdmin,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";

const router = Router();

// Every admin management endpoint requires authentication
// and SUPER_ADMIN authorization.
router.use(authenticateAdmin);
router.use(authorizeRoles("SUPER_ADMIN"));

router.post("/", createAdmin);

router.get("/", listAdmins);

router.get("/:id", getAdmin);

router.patch("/:id", editAdmin);

router.patch("/:id/role", changeAdminRole);

router.patch("/:id/status", changeAdminStatus);

router.delete("/:id", removeAdmin);

export default router;
