import { Router } from "express";
import { createUser, getAuthenticatedUser } from "../controllers/user.controller";

const router = Router()

router.route('/create').post(createUser)
router.route('/auth-me').get(getAuthenticatedUser);

export default router;