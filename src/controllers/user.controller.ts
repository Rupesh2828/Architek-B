import { Request, Response } from "express";
import prisma from "../config/database";
import bcrypt from "bcryptjs"
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { getContext } from "../utils/request-context";
import logger from "../utils";

declare module 'express-session' {
    interface Session {
        userId?: string;
        role?: string;
    }
}


export const getAuthenticatedUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.session?.userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            res.status(401).json({ error: "Session expired, please log in again" });
            return;
        }

        const context = getContext();
        console.log(`[${context?.requestId}] Authenticated user: ${user.id}`);

        res.status(200).json({ user });

    } catch (error) {
        console.error('Error fetching authenticated user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, username, role } = req.body


        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(409).json({ error: 'User already exists' });
            return;

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
                createdAt: true,
            },

        })

        const context = getContext();
        if (context) {
            logger.info(`[${context.requestId}] User created with ID: ${newUser.id}`);
            logger.info(`Request ID: ${context.requestId} | User ID: ${context.userId}`);
        } else {
            console.warn('No context found for logging user creation');
        }

        // const accessToken = generateAccessToken({ id: newUser.id, role: newUser.role })
        // const refreshToken = generateRefreshToken({ id: newUser.id });

        if (req.session) {
            req.session.userId = newUser.id;
            req.session.role = newUser.role;
        } else {
            console.warn('Session object is undefined');
        }

        res.status(201).json({
            message: 'User created successfully', user: newUser,

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });

    }

}

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        logger.info({ email }, "User login attempt");


        if (!email || !password) {
            res.status(400).json({ error: "Email and password are required" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });


        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }

        req.session.userId = user.id;
        req.session.role = user.role;

        res.status(200).json({ message: "Login successful", user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const logoutUser = async (req: Request, res: Response): Promise<void> => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: "Logout failed" });
            return;
        }
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout successful" });
    });
}


export const deleteUserWithData = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ message: "ID is required" });
            return;
        }

        await prisma.$transaction([
            prisma.comment.deleteMany({
                where: { authorId: id }
            }),

            prisma.project.deleteMany({
                where: { ownerId: id }
            }),

            prisma.task.updateMany({
                where: { assigneeId: id },
                data: { assigneeId: null }
            }),

            prisma.profile.deleteMany({
                where: { userId: id }
            }),

            prisma.organizationMember.deleteMany({
                where: { userId: id }
            }),

            prisma.user.delete({
                where: { id }
            })
        ]);

        res.status(200).json({ message: "User and related data deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

