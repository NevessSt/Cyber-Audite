import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createFinding, getFindingsByAudit, updateFinding, deleteFinding } from '../controllers/findingController';
import { validateRequest } from '../middleware/validate';
import { createFindingSchema, updateFindingSchema } from '../schemas';

const router = express.Router();

router.post('/', authenticateToken, validateRequest(createFindingSchema), createFinding);
router.get('/audit/:auditId', authenticateToken, getFindingsByAudit);
router.put('/:id', authenticateToken, validateRequest(updateFindingSchema), updateFinding);
router.delete('/:id', authenticateToken, deleteFinding);

export default router;
