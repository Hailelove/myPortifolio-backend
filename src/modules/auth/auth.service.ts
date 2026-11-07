import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";

import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { LoginInput, SetupAdminInput } from "./auth.validation.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

const createToken = (
  adminId: string,
  role: "ADMIN" | "SUPER_ADMIN",
  sessionId: string,
): string => {
  return jwt.sign(
    {
      role,
      sid: sessionId,
    },
    env.JWT_SECRET,
    {
      subject: adminId,
      expiresIn: "7d",
    },
  );
};

const createAdminSession = async (
  admin: {
    id: string;
    role: "ADMIN" | "SUPER_ADMIN";
  },
  metadata: {
    userAgent?: string;
    ipAddress?: string;
  },
) => {
  const sessionId = randomUUID();

  const token = createToken(admin.id, admin.role, sessionId);

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.adminSession.create({
    data: {
      id: sessionId,
      adminId: admin.id,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    },
  });

  return { token, expiresAt };
};

export const authService = {
  async setupAdmin(
    input: SetupAdminInput,
    metadata: {
      userAgent?: string;
      ipAddress?: string;
    },
  ) {
    const admin = await prisma.$transaction(
      async (tx) => {
        const count = await tx.admin.count();

        if (count > 0) {
          throw new AppError(
            "Initial administrator has already been created.",
            403,
          );
        }

        const passwordHash = await bcrypt.hash(input.password, 12);

        return tx.admin.create({
          data: {
            username: input.username,
            email: input.email.toLowerCase(),
            passwordHash,
            fullName: input.fullName,
            role: "SUPER_ADMIN",
          },
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );

    const session = await createAdminSession(admin, metadata);

    return {
      admin,
      ...session,
    };
  },

  async login(
    input: LoginInput,
    metadata: {
      userAgent?: string;
      ipAddress?: string;
    },
  ) {
    const identifier = input.identifier.toLowerCase();

    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!admin || !admin.isActive) {
      throw new AppError("Invalid username/email or password.", 401);
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      admin.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError("Invalid username/email or password.", 401);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await createAdminSession(admin, metadata);

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      ...session,
    };
  },

  async logout(sessionId: string) {
    await prisma.adminSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  async getCurrentAdmin(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new AppError("Administrator account not found or inactive.", 401);
    }

    return admin;
  },

  hashToken,
};
