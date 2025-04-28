import { Router } from "express"; 
import { createUser, deleteUserWithData, getAuthenticatedUser, loginUser, logoutUser } from "../controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { loginSchema, userSchema } from "../zod-schema/userSchema";

const router = Router();

/**
 * @swagger
 * /api/v1/users/create:
 *   post:
 *     summary: Create a new user
 *     description: Creates a user with the provided data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully..
 */
router.post('/create', validateRequest(userSchema), createUser);


/**
 * @openapi
 * /api/v1/users/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User logged in successfully
 */
router.post('/login', validateRequest(loginSchema), loginUser);

/**
 * @openapi
 * /api/v1/users/logout:
 *   get:
 *     summary: Logout user
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.get('/logout', logoutUser);

/**
 * @openapi
 * /api/v1/users/delete/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/delete/:id', deleteUserWithData);

/**
 * @openapi
 * /api/v1/users/auth-me:
 *   get:
 *     summary: Get authenticated user info
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Authenticated user data
 */
router.get('/auth-me', getAuthenticatedUser);

export default router;
