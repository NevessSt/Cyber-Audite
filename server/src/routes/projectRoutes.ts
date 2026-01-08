import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createProject, getProjects } from '../controllers/projectController';

const router = express.Router();

router.post('/', authenticateToken, createProject);
router.get('/', authenticateToken, getProjects);

export default router;
