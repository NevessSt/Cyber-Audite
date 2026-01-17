import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getOverviewMetrics } from '../controllers/dashboardController';

const router = express.Router();

router.get('/overview', authenticateToken, getOverviewMetrics);

export default router;

