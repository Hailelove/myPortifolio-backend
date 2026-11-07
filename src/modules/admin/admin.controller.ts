import type { Request, Response, NextFunction } from "express";

import {
  createAdmin as createAdminService,
  getAdmins,
  getAdminById,
  updateAdmin,
  updateAdminRole,
  updateAdminStatus,
  deleteAdmin,
} from "./admin.service.js";

import {
  createAdminSchema,
  updateAdminSchema,
  updateAdminRoleSchema,
  updateAdminStatusSchema,
  adminIdSchema,
  adminQuerySchema,
} from "./admin.validation.js";

import { AppError } from "../../utils/app-error.js";

export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createAdminSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid admin data.", 400);
    }

    const admin = await createAdminService(parsed.data);

    res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const listAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = adminQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError("Invalid query parameters.", 400);
    }

    const result = await getAdmins(parsed.data);

    res.status(200).json({
      success: true,
      data: result.admins,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = adminIdSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError("Invalid admin ID.", 400);
    }

    const admin = await getAdminById(parsed.data.id);

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const editAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idParsed = adminIdSchema.safeParse(req.params);
    const bodyParsed = updateAdminSchema.safeParse(req.body);

    if (!idParsed.success || !bodyParsed.success) {
      throw new AppError("Invalid admin ID or update data.", 400);
    }

    const admin = await updateAdmin(idParsed.data.id, bodyParsed.data);

    res.status(200).json({
      success: true,
      message: "Admin updated successfully.",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const changeAdminRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idParsed = adminIdSchema.safeParse(req.params);
    const bodyParsed = updateAdminRoleSchema.safeParse(req.body);

    if (!idParsed.success || !bodyParsed.success) {
      throw new AppError("Invalid admin ID or role.", 400);
    }

    if (!req.admin) {
      throw new AppError("Authentication required.", 401);
    }

    const admin = await updateAdminRole(
      idParsed.data.id,
      bodyParsed.data.role,
      req.admin.id,
    );

    res.status(200).json({
      success: true,
      message: "Admin role updated successfully.",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const changeAdminStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idParsed = adminIdSchema.safeParse(req.params);
    const bodyParsed = updateAdminStatusSchema.safeParse(req.body);

    if (!idParsed.success || !bodyParsed.success) {
      throw new AppError("Invalid admin ID or status.", 400);
    }

    if (!req.admin) {
      throw new AppError("Authentication required.", 401);
    }

    const admin = await updateAdminStatus(
      idParsed.data.id,
      bodyParsed.data.isActive,
      req.admin.id,
    );

    res.status(200).json({
      success: true,
      message: "Admin status updated successfully.",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const removeAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = adminIdSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError("Invalid admin ID.", 400);
    }

    if (!req.admin) {
      throw new AppError("Authentication required.", 401);
    }

    const result = await deleteAdmin(parsed.data.id, req.admin.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
