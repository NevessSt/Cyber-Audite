import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';

export const getOverviewMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    const scanWhere = role === 'ADMIN' ? {} : { auditorId: userId };

    const [
      totalAudits,
      activeAudits,
      completedAudits,
      pendingReviewAudits,
      findingCounts,
      criticalFindings,
    ] = await Promise.all([
      prisma.auditScan.count({ where: scanWhere }),
      prisma.auditScan.count({ where: { ...scanWhere, status: { in: ['PLANNED', 'SCOPING', 'IN_PROGRESS'] } } }),
      prisma.auditScan.count({ where: { ...scanWhere, status: { in: ['COMPLETED', 'ARCHIVED'] } } }),
      prisma.auditScan.count({ where: { ...scanWhere, status: 'REVIEW' } }),
      prisma.auditFinding.groupBy({
        by: ['severity'],
        where: {
          auditScan: scanWhere,
        },
        _count: { _all: true },
      }),
      prisma.auditFinding.count({
        where: {
          auditScan: scanWhere,
          severity: 'CRITICAL',
          status: { in: ['OPEN', 'IN_REVIEW', 'CONFIRMED'] },
        },
      }),
    ]);

    const severityCounts: Record<string, number> = {};
    findingCounts.forEach((row) => {
      severityCounts[row.severity] = row._count._all;
    });

    res.json({
      totalAudits,
      activeAudits,
      completedAudits,
      pendingReviewAudits,
      severityCounts,
      criticalOpenFindings: criticalFindings,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
};

