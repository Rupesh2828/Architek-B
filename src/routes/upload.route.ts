import { Router, Request, Response, NextFunction } from "express";
import { getAuthenticatedUser } from "../controllers/user.controller";
import { uploadFiles } from "../services/s3upload";
import prisma from "../config/database";

const router = Router();

router.post(
  '/upload', // Middleware to set req.session.userId
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.session.userId) {
        res.status(401).json({ error: "Unauthorized - User not authenticated" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.session.userId }
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const uploadedFiles = await uploadFiles(req, user);

      res.status(200).json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown upload error"
      });
    }
  }
);

export default router;
