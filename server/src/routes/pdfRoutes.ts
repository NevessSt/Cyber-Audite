import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { downloadReportPDF } from '../controllers/pdfController';

const router = express.Router();

router.get('/:id/pdf', authenticateToken, downloadReportPDF);

export default router;
