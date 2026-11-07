import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.string().trim().email().max(150),

  subject: z.string().trim().max(150).optional(),

  message: z.string().trim().min(10).max(10000),
});

export const contactIdSchema = z.object({
  id: z.string().cuid(),
});

export const contactStatusSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]),
});

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]).optional(),

  search: z.string().trim().max(150).optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export type ContactQueryInput = z.infer<typeof contactQuerySchema>;
