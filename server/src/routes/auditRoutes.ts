import express from 'express';
import { createAudit, getAudits, getAuditById, runAuditScan } from '../controllers/auditController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, authorizeRole(['ADMIN', 'AUDITOR']), createAudit);
router.get('/', authenticateToken, getAudits);
router.get('/:id', authenticateToken, getAuditById);
router.post('/:id/scan', authenticateToken, authorizeRole(['ADMIN', 'AUDITOR']), runAuditScan);

export default router;
