import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type {
  CreateContactInput,
  ContactQueryInput,
} from "./contact.validation.js";

export const createContactMessage = async (
  data: CreateContactInput,
  metadata: {
    ipAddress?: string;
    userAgent?: string;
  },
) => {
  return prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      subject: data.subject || null,
      message: data.message,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
    select: {
      id: true,
      name: true,
      email: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });
};

export const getContactMessages = async (query: ContactQueryInput) => {
  const { page, limit, status, search } = query;

  const where: Prisma.ContactMessageWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { subject: { contains: search, mode: "insensitive" } },
            { message: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [messages, total] = await prisma.$transaction([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        readAt: true,
        repliedAt: true,
      },
    }),

    prisma.contactMessage.count({ where }),
  ]);

  return {
    messages,
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

export const getContactMessageById = async (id: string) => {
  const message = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!message) {
    throw new AppError("Contact message not found.", 404);
  }

  // Automatically mark a new message as read.
  if (message.status === "NEW") {
    return prisma.contactMessage.update({
      where: { id },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });
  }

  return message;
};

export const updateContactMessageStatus = async (
  id: string,
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED",
) => {
  const existing = await prisma.contactMessage.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError("Contact message not found.", 404);
  }

  const data: Prisma.ContactMessageUpdateInput = {
    status,
  };

  if (status === "READ" && !existing.readAt) {
    data.readAt = new Date();
  }

  if (status === "REPLIED" && !existing.repliedAt) {
    data.repliedAt = new Date();
  }

  return prisma.contactMessage.update({
    where: { id },
    data,
  });
};

export const deleteContactMessage = async (id: string) => {
  const existing = await prisma.contactMessage.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Contact message not found.", 404);
  }

  await prisma.contactMessage.delete({
    where: { id },
  });

  return { message: "Contact message deleted successfully." };
};
