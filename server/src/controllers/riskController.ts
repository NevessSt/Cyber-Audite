import { Response } from 'express';
import prisma from '../services/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAuditRiskSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const audit = await prisma.auditScan.findUnique({
      where: { id },
      include: {
        auditor: true,
        project: true,
        riskSummary: true,
        findings: true,
      },
    });

    if (!audit) return res.status(404).json({ error: 'Audit not found' });

    if (req.user?.role !== 'ADMIN' && audit.auditorId !== req.user?.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const severityCounts = audit.findings.reduce<Record<string, number>>((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {});

    const owaspBuckets = new Map<string, number>();
    const isoControls = new Set<string>();
    const nistFunctions = new Set<string>();

    for (const f of audit.findings) {
      const owaspKey = f.owaspTop10 || f.owaspCategory;
      owaspBuckets.set(owaspKey, (owaspBuckets.get(owaspKey) ?? 0) + 1);

      if (f.iso27001Control) isoControls.add(f.iso27001Control);
      if (f.nistCsfFunction) nistFunctions.add(f.nistCsfFunction);
    }

    res.json({
      audit: {
        id: audit.id,
        name: audit.name,
        status: audit.status,
      },
      riskScore: audit.riskSummary?.riskScore ?? null,
      severityCounts,
      owaspTop10: Array.from(owaspBuckets, ([category, count]) => ({ category, count })),
      iso27001Controls: Array.from(isoControls),
      nistCsfFunctions: Array.from(nistFunctions),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load audit risk summary' });
  }
};

