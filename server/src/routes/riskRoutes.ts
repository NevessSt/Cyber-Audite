import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAuditRiskSummary } from '../controllers/riskController';

const router = express.Router();

router.get('/audits/:id/summary', authenticateToken, getAuditRiskSummary);

export default router;

