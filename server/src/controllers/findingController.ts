import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';

export const createFinding = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, remediation, affectedResource, cvssScore, severity, auditId } = req.body;
    
    // Authorization Check
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) return res.status(404).json({ error: 'Audit not found' });

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this audit' });
    }

    const finding = await prisma.finding.create({
      data: {
        title,
        description,
        remediation,
        affectedResource,
        cvssScore: cvssScore ? parseFloat(cvssScore) : null,
        severity,
        auditId,
        createdById: req.user?.userId, // Set creator
      }
    });

    await logAction(req.user!.userId, 'FINDING_CREATE', 'Finding', finding.id, { title, auditId }, req);

    res.status(201).json(finding);
  } catch (error) {
    res.status(500).json({ error: 'Error creating finding' });
  }
};

export const getFindingsByAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.params;

    // Authorization Check
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) return res.status(404).json({ error: 'Audit not found' });

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this audit' });
    }

    const findings = await prisma.finding.findMany({
      where: { auditId },
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
    const { title, description, remediation, affectedResource, cvssScore, severity, status } = req.body;

    // Authorization Check via Finding -> Audit
    const existingFinding = await prisma.finding.findUnique({
      where: { id },
      include: { audit: true }
    });

    if (!existingFinding) return res.status(404).json({ error: 'Finding not found' });

    if (req.user?.role !== 'ADMIN' && existingFinding.audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this finding' });
    }

    const finding = await prisma.finding.update({
      where: { id },
      data: {
        title,
        description,
        remediation,
        affectedResource,
        cvssScore: cvssScore ? parseFloat(cvssScore) : null,
        severity,
        status,
        updatedById: req.user?.userId, // Set updater
      }
    });

    await logAction(req.user!.userId, 'FINDING_UPDATE', 'Finding', finding.id, { changes: req.body }, req);

    res.json(finding);
  } catch (error) {
    res.status(500).json({ error: 'Error updating finding' });
  }
};

export const deleteFinding = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Authorization Check
    const existingFinding = await prisma.finding.findUnique({
      where: { id },
      include: { audit: true }
    });

    if (!existingFinding) return res.status(404).json({ error: 'Finding not found' });

    if (req.user?.role !== 'ADMIN' && existingFinding.audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this finding' });
    }

    await prisma.finding.delete({
      where: { id }
    });

    await logAction(req.user!.userId, 'FINDING_DELETE', 'Finding', id, { title: existingFinding.title }, req);

    res.json({ message: 'Finding deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting finding' });
  }
};
