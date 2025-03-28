import {z} from "zod"

export const userSchema = z.object({
    email: z.string().email("Enter valid email format"),
    password: z.string().min(5,"Password must of be of 5 characters"),
    username: z.string().min(4,"Username must of be of 5 characters"),
    role: z.enum(["user", "admin"]),
})