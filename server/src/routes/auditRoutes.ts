import express from 'express';
import { createAudit, getAudits, getAuditById, runAuditScan } from '../controllers/auditController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createAuditSchema } from '../schemas';

const router = express.Router();

router.post('/', authenticateToken, authorizeRole(['ADMIN', 'AUDITOR']), validateRequest(createAuditSchema), createAudit);
router.get('/', authenticateToken, getAudits);
router.get('/:id', authenticateToken, getAuditById);
router.post('/:id/scan', authenticateToken, authorizeRole(['ADMIN', 'AUDITOR']), runAuditScan);

export default router;
