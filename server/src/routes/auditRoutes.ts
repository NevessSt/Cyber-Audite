import express from 'express';
import { createAudit, getAudits, getAuditById, runAuditScan } from '../controllers/auditController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, createAudit);
router.get('/', authenticateToken, getAudits);
router.get('/:id', authenticateToken, getAuditById);
router.post('/:id/scan', authenticateToken, runAuditScan);

export default router;
