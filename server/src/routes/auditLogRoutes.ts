import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAuditLogs } from '../controllers/auditLogController';

const router = express.Router();

router.get('/', authenticateToken, getAuditLogs);

export default router;
