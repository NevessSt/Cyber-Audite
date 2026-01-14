import express from 'express';
import { register, login, refreshToken, logout, getUsers, updateUserRole } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/', authenticateToken, authorizeRole(['ADMIN']), getUsers);
router.patch('/:id/role', authenticateToken, authorizeRole(['ADMIN']), updateUserRole);

export default router;
