import { Router } from "express";
import { createOrganizationWithOwner, deleteOrganizationCascade } from "../controllers/organization.controller";

const router = Router();

/**
 * @swagger
 * /api/organizations/create:
 *   post:
 *     summary: Create an organization with an owner
 *     responses:
 *       201:
 *         description: Organization created
 */
router.route('/create').post(createOrganizationWithOwner);

/**
 * @swagger
 * /api/organizations/delete/{id}:
 *   delete:
 *     summary: Delete organization by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization deleted
 */
router.route('/delete/:id').delete(deleteOrganizationCascade);

export default router;
