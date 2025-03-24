import { Request, Response } from "express";
import prisma from "../config/database";


export const getAuthenticatedUser = async (req: Request, res: Response): Promise<void> => {
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
  };
  