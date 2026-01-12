import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';
import { Prisma } from '@prisma/client';

export const createFinding = async (req: AuthRequest, res: Response) => {
  try {
    const { 
        title, 
        description, 
        owaspCategory, 
        severity, 
        impact, 
        recommendation, 
        affectedFileOrRoute, 
        auditScanId 
    } = req.body;
    
    // Authorization Check
    const audit = await prisma.auditScan.findUnique({ where: { id: auditScanId } });
    if (!audit) return res.status(404).json({ error: 'Audit Scan not found' });

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this audit' });
    }

    const finding = await prisma.auditFinding.create({
      data: {
        title,
        description,
        owaspCategory,
        severity,
        impact,
        recommendation,
        affectedFileOrRoute,
        auditScanId,
        createdById: req.user?.userId, // Set creator
      }
    });

    await logAction(req.user!.userId, 'FINDING_CREATE', 'AuditFinding', finding.id, { title, auditScanId }, req);

    res.status(201).json(finding);
  } catch (error) {
    res.status(500).json({ error: 'Error creating finding' });
  }
};

export const getFindingsByAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.params;

    // Authorization Check
    const audit = await prisma.auditScan.findUnique({ where: { id: auditId } });
    if (!audit) return res.status(404).json({ error: 'Audit Scan not found' });

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this audit' });
    }

    const findings = await prisma.auditFinding.findMany({
      where: { auditScanId: auditId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(findings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching findings' });
  }
};

export const updateFinding = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
        title, 
        description, 
        owaspCategory, 
        severity, 
        impact, 
        recommendation, 
        affectedFileOrRoute, 
        status,
        justification 
    } = req.body;

    // Authorization Check via Finding -> Audit
    const existingFinding = await prisma.auditFinding.findUnique({
      where: { id },
      include: { auditScan: true }
    });

    if (!existingFinding) return res.status(404).json({ error: 'Finding not found' });

    if (req.user?.role !== 'ADMIN' && existingFinding.auditScan.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this finding' });
    }

    // MANDATORY JUSTIFICATION for Severity Reduction
    const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const oldSeverityIndex = severityLevels.indexOf(existingFinding.severity);
    const newSeverityIndex = severityLevels.indexOf(severity);

    if (newSeverityIndex < oldSeverityIndex && !justification) {
        return res.status(400).json({ error: 'Severity reduction requires a justification reason.' });
    }

    // Transaction: Update + History Log
    const finding = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updated = await tx.auditFinding.update({
            where: { id },
            data: {
                title,
                description,
                owaspCategory,
                severity,
                impact,
                recommendation,
                affectedFileOrRoute,
                status,
                updatedById: req.user?.userId,
            }
        });

        // Create History Record
        await tx.findingHistory.create({
            data: {
                findingId: id,
                userId: req.user!.userId,
                action: 'UPDATE',
                changes: {
                    from: {
                        severity: existingFinding.severity,
                        status: existingFinding.status
                    },
                    to: {
                        severity: severity,
                        status: status
                    }
                },
                reason: justification || 'Routine update'
            }
        });

        return updated;
    });

    await logAction(req.user!.userId, 'FINDING_UPDATE', 'AuditFinding', finding.id, { changes: req.body }, req);

    res.json(finding);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating finding' });
  }
};

export const deleteFinding = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingFinding = await prisma.auditFinding.findUnique({
      where: { id },
      include: { auditScan: true }
    });

    if (!existingFinding) return res.status(404).json({ error: 'Finding not found' });

    if (req.user?.role !== 'ADMIN' && existingFinding.auditScan.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.auditFinding.delete({ where: { id } });
    await logAction(req.user!.userId, 'FINDING_DELETE', 'AuditFinding', id, {}, req);

    res.json({ message: 'Finding deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting finding' });
  }
};
