import { Router } from "express";
import { createOrganizationWithOwner, deleteOrganizationCascade } from "../controllers/organization.controller";

const router = Router()

router.route('/create').post(createOrganizationWithOwner)
router.route('/delete/:id').delete(deleteOrganizationCascade)


export default router;