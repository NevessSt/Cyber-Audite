import { Request, Response } from 'express';
import prisma from '../services/prisma';

export const createAudit = async (req: Request, res: Response) => {
  try {
    const { name, projectId, auditorId } = req.body;
    const audit = await prisma.audit.create({
      data: {
        name,
        projectId,
        auditorId,
      },
    });
    res.status(201).json(audit);
  } catch (error) {
    res.status(500).json({ error: 'Error creating audit' });
  }
};

export const getAudits = async (req: Request, res: Response) => {
  try {
    const audits = await prisma.audit.findMany({
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
