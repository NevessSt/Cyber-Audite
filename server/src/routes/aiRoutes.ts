import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { refineFindingText, suggestRemediation } from '../controllers/aiController';

const router = express.Router();

router.post('/refine', authenticateToken, aiLimiter, refineFindingText);
router.post('/remediate', authenticateToken, aiLimiter, suggestRemediation);

export default router;
