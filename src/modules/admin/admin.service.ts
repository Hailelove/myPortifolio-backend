import bcrypt from "bcrypt";

import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";

import type {
  CreateAdminInput,
  UpdateAdminInput,
  AdminQueryInput,
} from "./admin.validation.js";

// Fields safe to return to the API.
const adminSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminSelect;

// Create a new admin.
export const createAdmin = async (data: CreateAdminInput) => {
  const existingAdmin = await prisma.admin.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email.toLowerCase() }],
    },
    select: { id: true },
  });

  if (existingAdmin) {
    throw new AppError(
      "An admin with this username or email already exists.",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    return await prisma.admin.create({
      data: {
        username: data.username,
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        role: data.role,
      },
      select: adminSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Username or email already exists.", 409);
    }

    throw error;
  }
};

// List admins with pagination and filtering.
export const getAdmins = async (query: AdminQueryInput) => {
  const { page, limit, search, role, isActive } = query;

  const where: Prisma.AdminWhereInput = {
    ...(role ? { role } : {}),
    ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [admins, total] = await prisma.$transaction([
    prisma.admin.findMany({
      where,
      select: adminSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.admin.count({ where }),
  ]);

  return {
    admins,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

// Get a single admin.
export const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: {
      ...adminSelect,
      _count: {
        select: { sessions: true },
      },
    },
  });

  if (!admin) {
    throw new AppError("Admin not found.", 404);
  }

  return admin;
};

// Update admin profile.
export const updateAdmin = async (id: string, data: UpdateAdminInput) => {
  const existing = await prisma.admin.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Admin not found.", 404);
  }

  if (data.username || data.email) {
    const duplicate = await prisma.admin.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(data.username ? [{ username: data.username }] : []),
          ...(data.email ? [{ email: data.email.toLowerCase() }] : []),
        ],
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new AppError("Username or email already exists.", 409);
    }
  }

  try {
    return await prisma.admin.update({
      where: { id },
      data: {
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(data.email !== undefined
          ? { email: data.email.toLowerCase() }
          : {}),
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      },
      select: adminSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Username or email already exists.", 409);
    }

    throw error;
  }
};

// Change admin role.
export const updateAdminRole = async (
  id: string,
  role: "ADMIN" | "SUPER_ADMIN",
  currentAdminId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const target = await tx.admin.findUnique({
      where: { id },
    });

    if (!target) {
      throw new AppError("Admin not found.", 404);
    }

    if (
      target.role === "SUPER_ADMIN" &&
      target.isActive &&
      role !== "SUPER_ADMIN"
    ) {
      const activeSuperAdmins = await tx.admin.count({
        where: {
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new AppError(
          "You cannot demote the last active Super Admin.",
          400,
        );
      }
    }

    const updated = await tx.admin.update({
      where: { id },
      data: { role },
      select: adminSelect,
    });

    // If the current administrator loses Super Admin privileges,
    // revoke their other sessions.
    if (
      id === currentAdminId &&
      target.role === "SUPER_ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      await tx.adminSession.updateMany({
        where: {
          adminId: id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    return updated;
  });
};

// Activate or deactivate admin.
export const updateAdminStatus = async (
  id: string,
  isActive: boolean,
  currentAdminId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const target = await tx.admin.findUnique({
      where: { id },
    });

    if (!target) {
      throw new AppError("Admin not found.", 404);
    }

    if (id === currentAdminId && !isActive) {
      throw new AppError("You cannot deactivate your own account.", 400);
    }

    if (target.role === "SUPER_ADMIN" && target.isActive && !isActive) {
      const activeSuperAdmins = await tx.admin.count({
        where: {
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new AppError(
          "You cannot deactivate the last active Super Admin.",
          400,
        );
      }
    }

    const updated = await tx.admin.update({
      where: { id },
      data: { isActive },
      select: adminSelect,
    });

    if (!isActive) {
      await tx.adminSession.updateMany({
        where: {
          adminId: id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    return updated;
  });
};

// Delete admin.
export const deleteAdmin = async (id: string, currentAdminId: string) => {
  return prisma.$transaction(async (tx) => {
    const target = await tx.admin.findUnique({
      where: { id },
    });

    if (!target) {
      throw new AppError("Admin not found.", 404);
    }

    if (id === currentAdminId) {
      throw new AppError("You cannot delete your own account.", 400);
    }

    if (target.role === "SUPER_ADMIN" && target.isActive) {
      const activeSuperAdmins = await tx.admin.count({
        where: {
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new AppError(
          "You cannot delete the last active Super Admin.",
          400,
        );
      }
    }

    await tx.admin.delete({
      where: { id },
    });

    return {
      message: "Admin deleted successfully.",
    };
  });
};
