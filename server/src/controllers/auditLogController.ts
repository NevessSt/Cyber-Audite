import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    // Only ADMIN can view all logs. Auditors might view logs related to them?
    // For now, strict: ADMIN only.
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { page = 1, limit = 50, userId, entity, action } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (userId) where.userId = String(userId);
    if (entity) where.entity = String(entity);
    if (action) where.action = String(action);

    const logs = await prisma.auditLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, name: true, role: true }
        }
      }
    });

    const total = await prisma.auditLog.count({ where });

    res.json({
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching audit logs' });
  }
};
