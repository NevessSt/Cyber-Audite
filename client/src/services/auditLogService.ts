import api from './api';

export interface AuditLog {
  id: string;
  userId: string;
  user: {
    email: string;
    name: string | null;
    role: string;
  };
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditLogService = {
  getLogs: async (page = 1, limit = 50, filters?: { userId?: string; entity?: string; action?: string }) => {
    const params = { page, limit, ...filters };
    const response = await api.get<AuditLogResponse>('/audit-logs', { params });
    return response.data;
  }
};
