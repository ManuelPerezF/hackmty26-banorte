import { z } from "zod";
export const emailSchema = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const registerSchema = z.strictObject({
  displayName: z.string().trim().min(1).max(80),
  email: emailSchema,
  password: z.string().min(15).max(128),
});
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type Registration = z.infer<typeof registerSchema>;
