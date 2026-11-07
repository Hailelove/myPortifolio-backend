import type { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { authService } from "../modules/auth/auth.service.js";

const COOKIE_NAME = "portfolio_admin_session";

export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      throw new AppError("Authentication required.", 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === "string") {
      throw new AppError("Invalid session.", 401);
    }

    const adminId = decoded.sub;
    const sessionId = decoded.sid;

    if (typeof adminId !== "string" || typeof sessionId !== "string") {
      throw new AppError("Invalid session.", 401);
    }

    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      include: { admin: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.adminId !== adminId ||
      session.tokenHash !== authService.hashToken(token) ||
      !session.admin.isActive
    ) {
      throw new AppError("Session expired or invalid.", 401);
    }

    req.admin = {
      id: session.admin.id,
      username: session.admin.username,
      email: session.admin.email,
      fullName: session.admin.fullName,
      role: session.admin.role,
    };

    req.sessionId = session.id;

    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (
  ...allowedRoles: Array<"ADMIN" | "SUPER_ADMIN">
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      next(new AppError("Authentication required.", 401));
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      next(new AppError("Access denied.", 403));
      return;
    }

    next();
  };
};
