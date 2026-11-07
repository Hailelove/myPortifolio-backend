import { z } from "zod";

export const setupAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/),

  email: z.string().trim().email().max(150),

  password: z.string().min(12).max(72),

  fullName: z.string().trim().min(2).max(100).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(150),

  password: z.string().min(1).max(72),
});

export type SetupAdminInput = z.infer<typeof setupAdminSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
