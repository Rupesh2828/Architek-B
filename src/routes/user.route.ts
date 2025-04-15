import { Router } from "express";
import { createUser, getAuthenticatedUser, loginUser, logoutUser } from "../controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { loginSchema, userSchema } from "../zod-schema/userSchema";

const router = Router()

router.route('/create').post( validateRequest(userSchema),createUser)
router.route('/login').get( validateRequest(loginSchema),loginUser)
router.route('/logout').get(logoutUser)
router.route('/auth-me').get(getAuthenticatedUser);

export default router;