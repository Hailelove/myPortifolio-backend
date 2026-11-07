import type { Request, Response, NextFunction } from "express";

import {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
  deleteContactMessage,
} from "./contact.service.js";

import {
  createContactSchema,
  contactIdSchema,
  contactQuerySchema,
  contactStatusSchema,
} from "./contact.validation.js";

import { AppError } from "../../utils/app-error.js";

export const createContact = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createContactSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid contact message data.", 400);
    }

    const message = await createContactMessage(parsed.data, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });

    res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const listContacts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = contactQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError("Invalid query parameters.", 400);
    }

    const result = await getContactMessages(parsed.data);

    res.status(200).json({
      success: true,
      data: result.messages,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getContact = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = contactIdSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError("Invalid contact message ID.", 400);
    }

    const message = await getContactMessageById(parsed.data.id);

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const updateContactStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idParsed = contactIdSchema.safeParse(req.params);
    const statusParsed = contactStatusSchema.safeParse(req.body);

    if (!idParsed.success || !statusParsed.success) {
      throw new AppError("Invalid contact ID or status.", 400);
    }

    const message = await updateContactMessageStatus(
      idParsed.data.id,
      statusParsed.data.status,
    );

    res.status(200).json({
      success: true,
      message: "Contact message status updated.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const removeContact = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = contactIdSchema.safeParse(req.params);

    if (!parsed.success) {
      throw new AppError("Invalid contact message ID.", 400);
    }

    const result = await deleteContactMessage(parsed.data.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
