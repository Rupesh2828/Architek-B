import { Router } from "express";
import { createUser, getAuthenticatedUser } from "../controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { userSchema } from "../zod-schema/userSchema";

const router = Router()

router.route('/create').post( validateRequest(userSchema),createUser)
router.route('/auth-me').get(getAuthenticatedUser);

export default router;