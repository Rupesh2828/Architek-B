import { Request, Response } from "express";
import prisma from "../config/database";

export const createOrganizationWithOwner = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.body;
      const userId = req.session.userId; 
  
      if (!name || !userId) {
        res.status(400).json({ message: "Organization name and user ID are required." });
        return;
      }
  
      await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name,
          },
        });
  
        await tx.organizationMember.create({
          data: {
            userId,
            organizationId: org.id,
            role: "OWNER",
          },
        });
      });
  
      res.status(201).json({ message: "Organization created with owner" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  