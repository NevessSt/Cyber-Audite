import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';
import { AuditFinding } from '@prisma/client';

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.body;

    // 1. Authorization Check
    const audit = await prisma.auditScan.findUnique({
      where: { id: auditId },
      include: {
        project: true,
        auditor: true,
        findings: true
      }
    });

    if (!audit) {
      return res.status(404).json({ error: 'Audit Scan not found' });
    }

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this audit' });
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
    audit.findings.forEach((finding: AuditFinding, index: number) => {
      reportContent += `### ${index + 1}. ${finding.title} (${finding.severity})\n`;
      reportContent += `**Category:** ${finding.owaspCategory}\n`;
      reportContent += `**Description:** ${finding.description}\n`;
      reportContent += `**Impact:** ${finding.impact}\n`;
      reportContent += `**Recommendation:** ${finding.recommendation || 'N/A'}\n\n`;
    });

    // 3. Save Report
    const report = await prisma.report.create({
      data: {
        title: `${audit.name} - Final Report`,
        content: reportContent,
        auditScanId: audit.id,
        createdById: req.user?.userId,
      }
    });

    await logAction(req.user!.userId, 'REPORT_GENERATE', 'Report', report.id, { auditId }, req);

    res.status(201).json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Error generating report' });
  }
};

export const getReportsByAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.params;

    // Authorization Check
    const audit = await prisma.auditScan.findUnique({ where: { id: auditId } });
    if (!audit) return res.status(404).json({ error: 'Audit Scan not found' });

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this audit' });
    }

    const reports = await prisma.report.findMany({
      where: { auditScanId: auditId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reports' });
  }
};
