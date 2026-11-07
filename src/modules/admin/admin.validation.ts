import { z } from "zod";

export const createAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must contain at least 3 characters.")
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Invalid username format."),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(150),

  password: z
    .string()
    .min(12, "Password must contain at least 12 characters.")
    .max(72),

  fullName: z.string().trim().min(2).max(100).optional(),

  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
});

export const updateAdminSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_.-]+$/)
      .optional(),

    email: z.string().trim().email().max(150).optional(),

    fullName: z.string().trim().min(2).max(100).nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update.",
  );

export const updateAdminRoleSchema = z.object({
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

export const updateAdminStatusSchema = z.object({
  isActive: z.boolean(),
});

export const adminIdSchema = z.object({
  id: z.string().cuid(),
});

export const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z.string().trim().max(150).optional(),

  role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional(),

  isActive: z.enum(["true", "false"]).optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type AdminQueryInput = z.infer<typeof adminQuerySchema>;
