import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateReport = async (req: Request, res: Response) => {
  try {
    const { auditId } = req.body;

    // 1. Fetch Audit and Findings
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
        auditor: true,
        findings: true
      }
    });

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // 2. Generate Content (Simple Text/Markdown for now)
    const criticalCount = audit.findings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = audit.findings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = audit.findings.filter(f => f.severity === 'MEDIUM').length;

    let reportContent = `# Audit Report: ${audit.name}\n`;
    reportContent += `**Date:** ${new Date().toLocaleDateString()}\n`;
    reportContent += `**Client:** ${audit.project.clientName}\n`;
    reportContent += `**Auditor:** ${audit.auditor.name}\n\n`;
    
    reportContent += `## Executive Summary\n`;
    reportContent += `This audit identified ${audit.findings.length} findings.\n`;
    reportContent += `- Critical: ${criticalCount}\n`;
    reportContent += `- High: ${highCount}\n`;
    reportContent += `- Medium: ${mediumCount}\n\n`;

    reportContent += `## Detailed Findings\n`;
    audit.findings.forEach((finding, index) => {
      reportContent += `### ${index + 1}. ${finding.title} (${finding.severity})\n`;
      reportContent += `**Description:** ${finding.description}\n`;
      reportContent += `**Remediation:** ${finding.remediation || 'N/A'}\n\n`;
    });

    // 3. Save Report
    const report = await prisma.report.create({
      data: {
        title: `${audit.name} - Final Report`,
        content: reportContent,
        auditId: audit.id
      }
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Error generating report' });
  }
};

export const getReportsByAudit = async (req: Request, res: Response) => {
  try {
    const { auditId } = req.params;
    const reports = await prisma.report.findMany({
      where: { auditId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reports' });
  }
};
