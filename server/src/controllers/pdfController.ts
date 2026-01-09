import { Response } from 'express';
import prisma from '../services/prisma';
import { generateAuditPDF } from '../services/pdfService';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';

export const downloadReportPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Authorization Check
    const audit = await prisma.auditScan.findUnique({ where: { id } });
    
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this audit report' });
    }

    const pdfBuffer = await generateAuditPDF(id);

    await logAction(req.user!.userId, 'PDF_DOWNLOAD', 'AuditScan', id, { filename: `audit-report-${id}.pdf` }, req);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit-report-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
