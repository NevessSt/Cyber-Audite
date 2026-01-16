import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';
import { AuditEngine } from '../audit-engine';
import { AuditStatus, Prisma } from '@prisma/client';

// --- CONTROLLERS ---

// Step 1: Create Audit Scan (Planning Phase)
export const createAudit = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Get Validated Input
    const { name, projectId, auditorId, scanScope } = req.body;
    
    // 2. Authorization (RBAC)
    if (auditorId && auditorId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only Admins can assign audits to others' });
    }

    const assignedAuditorId = auditorId || req.user?.userId;

    // 3. Verify Project
    const project = await prisma.auditProject.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // 4. Create Scan Record
    const scan = await prisma.auditScan.create({
      data: {
        name,
        projectId,
        auditorId: assignedAuditorId!,
        createdById: req.user?.userId,
        status: 'PLANNED',
        scanScope: scanScope || project.scope // Inherit scope if not provided
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

    // STATE CHECK: Can only run if PLANNED or SCOPING
    if (!['PLANNED', 'SCOPING', 'IN_PROGRESS'].includes(scan.status)) {
        return res.status(400).json({ error: `Cannot run scan. Current status: ${scan.status}` });
    }

    // Update status to IN_PROGRESS
    await prisma.auditScan.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
    });

    const targetPath = scan.project.sourcePath;
    if (!targetPath) {
        return res.status(400).json({ error: 'Project has no source path defined' });
    }

    // --- EXECUTE ENGINE ---
    const results = await AuditEngine.runScan(targetPath);

    // Store Findings Transactionally
    await prisma.$transaction(async (tx) => {
        // Clear previous findings (if re-running)
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
                    createdById: req.user!.userId,
                    status: 'OPEN', // Default status
                    aiGenerated: false // Engine findings are deterministic, not AI
                }
            });
        }

        // Update Risk Summary
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

        // CRITICAL: Move to REVIEW, NOT COMPLETED. Humans must verify.
        await tx.auditScan.update({
            where: { id },
            data: { status: 'REVIEW' }
        });
    });

    await logAction(req.user!.userId, 'AUDIT_RUN', 'AuditScan', id, { findingCount: results.findings.length }, req);

    res.json({ message: 'Scan completed. Please review findings.', summary: results.summary, status: 'REVIEW' });
  } catch (error) {
    console.error('Scan failed:', error);
    // Revert status if failed
    await prisma.auditScan.update({ where: { id: req.params.id }, data: { status: 'PLANNED' } }); 
    res.status(500).json({ error: 'Error running audit scan' });
  }
};

// Step 3: Manual Status Transition (Enforce Workflow)
export const updateAuditStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body as { status?: AuditStatus };

        if (!status) {
          return res.status(400).json({ error: 'Status is required' });
        }

        const newStatus = status as AuditStatus;

        const scan = await prisma.auditScan.findUnique({ where: { id } });
        if (!scan) return res.status(404).json({ error: 'Scan not found' });

        // Valid Transitions
        const validTransitions: Record<AuditStatus, AuditStatus[]> = {
            'PLANNED': ['SCOPING', 'IN_PROGRESS'],
            'SCOPING': ['IN_PROGRESS', 'PLANNED'],
            'IN_PROGRESS': ['REVIEW'], // Only system should trigger this, but manual override allowed for stuck jobs
            'REVIEW': ['REPORT_GENERATED', 'IN_PROGRESS'], // Go back to progress if re-scan needed
            'REPORT_GENERATED': ['COMPLETED', 'REVIEW'],
            'COMPLETED': ['ARCHIVED', 'REPORT_GENERATED'], // Can re-open if needed
            'ARCHIVED': ['COMPLETED']
        };

        if (!validTransitions[scan.status].includes(newStatus) && req.user?.role !== 'ADMIN') {
            return res.status(400).json({ 
                error: `Invalid status transition from ${scan.status} to ${newStatus}` 
            });
        }

        const updated = await prisma.auditScan.update({
            where: { id },
            data: { status: newStatus }
        });

        await logAction(req.user!.userId, 'AUDIT_STATUS_CHANGE', 'AuditScan', id, { old: scan.status, new: newStatus }, req);

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
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
      orderBy: { updatedAt: 'desc' }
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
        findings: {
            orderBy: { severity: 'asc' } // Critical first (enum order might need check)
        },
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
