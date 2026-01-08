import { Request, Response } from 'express';
import { generateAuditPDF } from '../services/pdfService';

export const downloadReportPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pdfBuffer = await generateAuditPDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit-report-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
