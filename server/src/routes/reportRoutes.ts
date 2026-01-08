import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { generateReport, getReportsByAudit } from '../controllers/reportController';

const router = express.Router();

router.post('/generate', authenticateToken, generateReport);
router.get('/audit/:auditId', authenticateToken, getReportsByAudit);

export default router;
