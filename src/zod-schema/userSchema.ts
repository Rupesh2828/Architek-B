import { z } from "zod";

export const userSchema = z.object({
  email: z.string().email("Enter a valid email format"),
  password: z.string().min(5, "Password must be at least 5 characters long"),
  username: z.string().min(4, "Username must be at least 4 characters long"),
  role: z.enum(["USER", "ADMIN", "SUPERADMIN"]),
});

export const loginSchema = userSchema.pick({
    email: true,
    password: true,
});