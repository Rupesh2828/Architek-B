import { Router } from "express";
import { createUser } from "../controllers/user.controller";

const router = Router()

router.route('/create').post(createUser)

export default router;