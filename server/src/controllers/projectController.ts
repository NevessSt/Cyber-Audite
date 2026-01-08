import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, clientName, description } = req.body;
    
    if (!name || !clientName) {
      return res.status(400).json({ error: 'Name and Client Name are required' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        clientName,
        description,
        userId: req.user!.userId, // Created by current user
      },
    });

    await logAction(req.user!.userId, 'PROJECT_CREATE', 'Project', project.id, { name, clientName }, req);

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error creating project' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    // Admins see all. Users see projects they created OR projects they have audits in.
    // For simplicity: Users see all projects (as they are usually internal resources).
    // Or stricter: Users see projects they created.
    // Let's go with: All authenticated users can list projects (to select one when creating audit).
    
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { audits: true } }
      }
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects' });
  }
};
