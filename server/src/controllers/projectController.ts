import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, clientName, description, sourcePath, url } = req.body;
    
    // Validation handled by middleware

    const project = await prisma.auditProject.create({
      data: {
        name,
        clientName,
        description,
        sourcePath,
        url,
        userId: req.user!.userId, // Created by current user
      },
    });

    await logAction(req.user!.userId, 'PROJECT_CREATE', 'AuditProject', project.id, { name, clientName }, req);

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating project' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.auditProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { scans: true } }
      }
    });

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching projects' });
  }
};
