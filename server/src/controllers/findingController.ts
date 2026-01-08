import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createFinding = async (req: Request, res: Response) => {
  try {
    const { title, description, remediation, affectedResource, cvssScore, severity, auditId } = req.body;
    
    const finding = await prisma.finding.create({
      data: {
        title,
        description,
        remediation,
        affectedResource,
        cvssScore: cvssScore ? parseFloat(cvssScore) : null,
        severity,
        auditId
      }
    });

    res.status(201).json(finding);
  } catch (error) {
    res.status(500).json({ error: 'Error creating finding' });
  }
};

export const getFindingsByAudit = async (req: Request, res: Response) => {
  try {
    const { auditId } = req.params;
    const findings = await prisma.finding.findMany({
      where: { auditId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(findings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching findings' });
  }
};

export const updateFinding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, remediation, affectedResource, cvssScore, severity, status } = req.body;

    const finding = await prisma.finding.update({
      where: { id },
      data: {
        title,
        description,
        remediation,
        affectedResource,
        cvssScore: cvssScore ? parseFloat(cvssScore) : null,
        severity,
        status
      }
    });

    res.json(finding);
  } catch (error) {
    res.status(500).json({ error: 'Error updating finding' });
  }
};

export const deleteFinding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.finding.delete({
      where: { id }
    });
    res.json({ message: 'Finding deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting finding' });
  }
};
