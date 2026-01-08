import express from 'express';
import { createAudit, getAudits } from '../controllers/auditController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, createAudit);
router.get('/', authenticateToken, getAudits);

export default router;
