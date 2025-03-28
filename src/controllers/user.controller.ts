import { Request, Response } from "express";
import prisma from "../config/database";
import bcrypt from "bcryptjs"
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

declare module 'express-session' {
    interface Session {
        userId?: string;
        role?: string;
    }
}

//this is authenticate user handler only stays in controller.
export const getAuthenticatedUser = async (req: Request, res: Response): Promise<void> => {
   try {
     if (!req.session.userId) {
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
     res.status(200).json({ user });
   } catch (error) {
    console.log(error);
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

        // const accessToken = generateAccessToken({ id: newUser.id, role: newUser.role })
        // const refreshToken = generateRefreshToken({ id: newUser.id });

        if (req.session) {  // Check if session exists
            req.session.userId = newUser.id;
            req.session.role = newUser.role;
        } else {
            console.warn('Session object is undefined');
            // Continue without setting session properties
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


export const logoutUser = async(req:Request, res:Response):Promise<void> => {
    req.session.destroy((err) => {
        if (err) {
          res.status(500).json({ error: "Logout failed" });
          return;
        }
        res.clearCookie("connect.sid"); 
        res.status(200).json({ message: "Logout successful" });
      });
}

