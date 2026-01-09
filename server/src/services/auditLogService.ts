import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export const logAction = async (
  userId: string,
  action: string,
  entity: string,
  entityId: string, // Changed from string | null to string (Strict)
  details: any,
  req?: Request
) => {
  try {
    const ipAddress = req?.ip || req?.socket.remoteAddress || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Strict Mode: If logging fails, the action MUST fail.
    throw new Error('Audit Logging Failed: Action cannot be performed without audit trail.');
  }
};
