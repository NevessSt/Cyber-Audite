import express from 'express';
import { register, login, getUsers, updateUserRole } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/', authenticateToken, authorizeRole(['ADMIN']), getUsers);
router.patch('/:id/role', authenticateToken, authorizeRole(['ADMIN']), updateUserRole);

export default router;
