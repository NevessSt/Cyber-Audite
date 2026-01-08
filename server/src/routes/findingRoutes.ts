import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createFinding, getFindingsByAudit, updateFinding, deleteFinding } from '../controllers/findingController';

const router = express.Router();

router.post('/', authenticateToken, createFinding);
router.get('/audit/:auditId', authenticateToken, getFindingsByAudit);
router.put('/:id', authenticateToken, updateFinding);
router.delete('/:id', authenticateToken, deleteFinding);

export default router;
