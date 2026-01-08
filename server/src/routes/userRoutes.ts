import express from 'express';
import { register, login, getUsers, updateUserRole } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/', authenticateToken, getUsers);
router.patch('/:id/role', authenticateToken, updateUserRole);

export default router;
