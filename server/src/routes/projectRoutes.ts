import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createProject, getProjects } from '../controllers/projectController';
import { validateRequest } from '../middleware/validate';
import { createProjectSchema } from '../schemas';

const router = express.Router();

router.post('/', authenticateToken, validateRequest(createProjectSchema), createProject);
router.get('/', authenticateToken, getProjects);

export default router;
