import { Router } from "express";
import { createOrganizationWithOwner } from "../controllers/organization.controller";

const router = Router()

router.route('/create').post(createOrganizationWithOwner)


export default router;