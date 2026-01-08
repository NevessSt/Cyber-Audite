import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';

export const createAudit = async (req: AuthRequest, res: Response) => {
  try {
    const { name, projectId, auditorId } = req.body;
    
    // Authorization: User can only assign themselves unless they are ADMIN
    if (auditorId && auditorId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Cannot assign audit to another user' });
    }

    const assignedAuditorId = auditorId || req.user?.userId;

    // Verify Project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const audit = await prisma.audit.create({
      data: {
        name,
        projectId,
        auditorId: assignedAuditorId!,
        createdById: req.user?.userId,
      },
    });

    await logAction(req.user!.userId, 'AUDIT_CREATE', 'Audit', audit.id, { name, projectId }, req);

    res.status(201).json(audit);
  } catch (error) {
    res.status(500).json({ error: 'Error creating audit' });
  }
};

export const getAudits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const whereClause = userRole === 'ADMIN' ? {} : { auditorId: userId };

    const audits = await prisma.audit.findMany({
      where: whereClause,
      include: {
        project: true,
        auditor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching audits' });
  }
};

export const getAuditById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        project: true,
        auditor: { select: { id: true, name: true, email: true } },
      }
    });

    if (!audit) return res.status(404).json({ error: 'Audit not found' });

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(audit);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching audit' });
  }
};
