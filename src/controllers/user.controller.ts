import { Request, Response } from "express";
import prisma from "../config/database";
import bcrypt from "bcryptjs"
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, username, role } = req.body

        if (!email || !password || !username || !role) {
            res.status(400).json({ error: "Username, Email, and Password are required" });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(409).json({ error: 'User already exists' });

        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({

            data: {
                username,
                email,
                password: hashedPassword,
                role
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                password: true,
                createdAt: true,
            },

        })

        const accessToken = generateAccessToken({ id: newUser.id, role: newUser.role })
        const refreshToken = generateRefreshToken({ id: newUser.id });

        res.status(201).json({
            message: 'User created successfully', user: newUser,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });

    }

}