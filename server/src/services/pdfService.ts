import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const generateAuditPDF = async (auditId: string): Promise<Buffer> => {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: {
      project: true,
      auditor: true,
      findings: true
    }
  });

  if (!audit) {
    throw new Error('Audit not found');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // --- Header ---
    doc.fontSize(20).text('Cyber Security Audit Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Audit Name: ${audit.name}`);
    doc.text(`Client: ${audit.project.clientName}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Auditor: ${audit.auditor.name}`);
    doc.moveDown();
    
    // --- Divider ---
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- Executive Summary ---
    doc.fontSize(16).text('Executive Summary');
    doc.moveDown(0.5);
    doc.fontSize(12).text(`This audit identified a total of ${audit.findings.length} findings.`);
    
    const critical = audit.findings.filter(f => f.severity === 'CRITICAL').length;
    const high = audit.findings.filter(f => f.severity === 'HIGH').length;
    const medium = audit.findings.filter(f => f.severity === 'MEDIUM').length;
    const low = audit.findings.filter(f => f.severity === 'LOW').length;

    doc.text(`- Critical: ${critical}`);
    doc.text(`- High: ${high}`);
    doc.text(`- Medium: ${medium}`);
    doc.text(`- Low: ${low}`);
    doc.moveDown();

    // --- Findings ---
    doc.fontSize(16).text('Detailed Findings');
    doc.moveDown();

    audit.findings.forEach((finding, i) => {
      // Title with Severity Color (Text representation for now)
      doc.fontSize(14).font('Helvetica-Bold').text(`${i + 1}. ${finding.title} [${finding.severity}]`);
      doc.font('Helvetica');
      doc.fontSize(12);
      
      doc.moveDown(0.5);
      doc.text('Description:', { underline: true });
      doc.text(finding.description);
      
      if (finding.remediation) {
        doc.moveDown(0.5);
        doc.text('Remediation:', { underline: true });
        doc.text(finding.remediation);
      }
      
      doc.moveDown(0.5);
      doc.text(`Status: ${finding.status}`);
      doc.text(`CVSS: ${finding.cvssScore || 'N/A'}`);
      
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).dash(5, { space: 5 }).stroke().undash();
      doc.moveDown();
    });

    doc.end();
  });
};
