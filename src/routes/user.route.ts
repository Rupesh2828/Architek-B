import { Router } from "express";
import { createUser } from "../controllers/user.controller";
import { getAuthenticatedUser } from "../middlewares/getAuthenticate";

const router = Router()

router.route('/create').post(getAuthenticatedUser,createUser)

export default router;