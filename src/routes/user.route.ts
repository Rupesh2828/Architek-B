import { Router } from "express";
import { createUser, deleteUserWithData, getAuthenticatedUser, loginUser, logoutUser } from "../controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { loginSchema, userSchema } from "../zod-schema/userSchema";

const router = Router()

router.route('/create').post( validateRequest(userSchema),createUser)
router.route('/login').get( validateRequest(loginSchema),loginUser)
router.route('/logout').get(logoutUser)
router.route('/delete/:id').delete(deleteUserWithData)
router.route('/auth-me').get(getAuthenticatedUser);

export default router;