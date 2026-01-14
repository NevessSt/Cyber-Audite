import { z } from 'zod';

// User Schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Project Schemas
export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    clientName: z.string().min(2, 'Client name is required'),
    description: z.string().optional(),
    sourcePath: z.string().optional(),
    url: z.string().url().optional().or(z.literal('')),
  }),
});

// Audit Schemas
export const createAuditSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    projectId: z.string().uuid(),
    auditorId: z.string().uuid().optional(),
    scanScope: z.string().optional(),
  }),
});

// Finding Schemas
export const createFindingSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    owaspCategory: z.string().optional(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
    impact: z.string().optional(),
    recommendation: z.string().optional(),
    affectedFileOrRoute: z.string().optional(),
    auditScanId: z.string().uuid(),
  }),
});

export const updateFindingSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional(),
    status: z.enum(['OPEN', 'IN_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE', 'FIXED', 'ACCEPTED_RISK']).optional(),
    justification: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
