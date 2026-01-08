import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export const logAction = async (
  userId: string,
  action: string,
  entity: string,
  entityId: string | null,
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
    // Do not throw, so main flow isn't interrupted? 
    // For a strict audit tool, maybe we SHOULD throw if logging fails.
    // But for availability, usually we log error and continue.
    // User rule: "Strict". If audit log fails, the action should probably fail.
    // I'll re-throw for strictness.
    throw new Error('Audit Logging Failed');
  }
};
