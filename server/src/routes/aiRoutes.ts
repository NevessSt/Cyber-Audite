import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { refineFindingText, suggestRemediation } from '../controllers/aiController';

const router = express.Router();

router.post('/refine', authenticateToken, refineFindingText);
router.post('/remediate', authenticateToken, suggestRemediation);

export default router;
