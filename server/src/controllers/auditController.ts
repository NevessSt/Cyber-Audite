import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';
import { AuditEngine } from '../audit-engine';

// Step 1: Create Audit Scan (Planning Phase)
export const createAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { name, projectId, auditorId } = req.body;
    
    // Authorization
    if (auditorId && auditorId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Cannot assign audit to another user' });
    }

    const assignedAuditorId = auditorId || req.user?.userId;

    // Verify Project exists
    const project = await prisma.auditProject.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const scan = await prisma.auditScan.create({
      data: {
        name,
        projectId,
        auditorId: assignedAuditorId!,
        createdById: req.user?.userId,
        status: 'PLANNED'
      },
    });

    await logAction(req.user!.userId, 'AUDIT_CREATE', 'AuditScan', scan.id, { name, projectId }, req);

    res.status(201).json(scan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating audit scan' });
  }
};

// Step 2: Run Automated Audit Scan
export const runAuditScan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const scan = await prisma.auditScan.findUnique({ 
        where: { id },
        include: { project: true }
    });

    if (!scan) return res.status(404).json({ error: 'Audit scan not found' });

    // Permission check
    if (req.user?.role !== 'ADMIN' && scan.auditorId !== req.user?.userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // Update status to IN_PROGRESS
    await prisma.auditScan.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
    });

    // Determine target path
    const targetPath = scan.project.sourcePath;
    if (!targetPath) {
        return res.status(400).json({ error: 'Project has no source path defined' });
    }

    // --- EXECUTE ENGINE ---
    const results = await AuditEngine.runScan(targetPath);

    // Store Findings
    // We use a transaction to ensure integrity
    await prisma.$transaction(async (tx) => {
        // Clear previous findings if any (for re-scans)
        await tx.auditFinding.deleteMany({ where: { auditScanId: id } });

        // Insert new findings
        for (const finding of results.findings) {
            await tx.auditFinding.create({
                data: {
                    title: finding.title,
                    description: finding.description,
                    owaspCategory: finding.owaspCategory,
                    severity: finding.severity,
                    impact: finding.impact,
                    recommendation: finding.recommendation,
                    affectedFileOrRoute: finding.affectedFileOrRoute,
                    auditScanId: id,
                    createdById: req.user!.userId
                }
            });
        }

        // Create/Update Risk Summary
        await tx.riskSummary.upsert({
            where: { auditScanId: id },
            create: {
                auditScanId: id,
                riskScore: results.riskScore,
                criticalCount: results.summary.critical,
                highCount: results.summary.high,
                mediumCount: results.summary.medium,
                lowCount: results.summary.low
            },
            update: {
                riskScore: results.riskScore,
                criticalCount: results.summary.critical,
                highCount: results.summary.high,
                mediumCount: results.summary.medium,
                lowCount: results.summary.low
            }
        });

        // Update Scan Status
        await tx.auditScan.update({
            where: { id },
            data: { status: 'COMPLETED' }
        });
    });

    await logAction(req.user!.userId, 'AUDIT_RUN', 'AuditScan', id, { findingCount: results.findings.length }, req);

    res.json({ message: 'Scan completed successfully', summary: results.summary });
  } catch (error) {
    console.error('Scan failed:', error);
    res.status(500).json({ error: 'Error running audit scan' });
  }
};

export const getAudits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const whereClause = userRole === 'ADMIN' ? {} : { auditorId: userId };

    const scans = await prisma.auditScan.findMany({
      where: whereClause,
      include: {
        project: true,
        auditor: {
          select: { id: true, name: true, email: true },
        },
        riskSummary: true
      },
    });
    res.json(scans);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching audits' });
  }
};

export const getAuditById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const scan = await prisma.auditScan.findUnique({
      where: { id },
      include: {
        project: true,
        auditor: { select: { id: true, name: true, email: true } },
        findings: true,
        riskSummary: true
      }
    });

    if (!scan) return res.status(404).json({ error: 'Audit not found' });

    if (req.user?.role !== 'ADMIN' && scan.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(scan);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching audit' });
  }
};
