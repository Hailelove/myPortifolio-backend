import type { Request, Response } from "express";

import { timingSafeEqual } from "node:crypto";

import { authService } from "./auth.service.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const COOKIE_NAME = "portfolio_admin_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setSessionCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
};

const clearSessionCookie = (res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

const getMetadata = (req: Request) => ({
  userAgent: req.get("user-agent") || undefined,
  ipAddress: req.ip || undefined,
});

const safeCompare = (provided: string, expected: string) => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

export const authController = {
  async setup(req: Request, res: Response) {
    const setupKey = req.get("x-admin-setup-key");

    if (!setupKey || !safeCompare(setupKey, env.ADMIN_SETUP_KEY)) {
      throw new AppError("Invalid setup key.", 403);
    }

    const result = await authService.setupAdmin(req.body, getMetadata(req));

    setSessionCookie(res, result.token);

    res.status(201).json({
      success: true,
      message: "Initial administrator created.",
      data: {
        admin: result.admin,
        expiresAt: result.expiresAt,
      },
    });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body, getMetadata(req));

    setSessionCookie(res, result.token);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        admin: result.admin,
        expiresAt: result.expiresAt,
      },
    });
  },

  async logout(req: Request, res: Response) {
    if (req.sessionId) {
      await authService.logout(req.sessionId);
    }

    clearSessionCookie(res);

    res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  },

  async me(req: Request, res: Response) {
    if (!req.admin) {
      throw new AppError("Authentication required.", 401);
    }

    const admin = await authService.getCurrentAdmin(req.admin.id);

    res.status(200).json({
      success: true,
      data: { admin },
    });
  },
};
