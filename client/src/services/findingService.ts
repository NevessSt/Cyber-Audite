import api from './api';

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  owaspCategory: string;
  owaspTop10?: string;
  iso27001Control?: string;
  nistCsfFunction?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impact: string;
  recommendation: string;
  affectedFileOrRoute: string;
  status: 'OPEN' | 'FIXED' | 'FALSE_POSITIVE' | 'IGNORED';
  auditScanId: string;
  createdAt: string;
  updatedAt: string;
}

// Alias for compatibility if needed, but better to switch to AuditFinding
export type Finding = AuditFinding; 

export type CreateFindingInput = {
  title: string;
  description: string;
  owaspCategory: string;
  owaspTop10?: string;
  iso27001Control?: string;
  nistCsfFunction?: string;
  severity: AuditFinding['severity'];
  impact: string;
  recommendation: string;
  affectedFileOrRoute: string;
  status?: AuditFinding['status'];
  auditScanId: string;
};

export const findingService = {
  create: async (data: CreateFindingInput) => {
    const response = await api.post<AuditFinding>('/findings', data);
    return response.data;
  },

  getByAudit: async (auditId: string) => {
    // Backend likely returns findings as part of GET /audits/:id, 
    // but if we have a specific endpoint:
    // The old endpoint was /findings/audit/:auditId
    // I need to ensure backend supports this or I use getAuditById
    const response = await api.get<AuditFinding[]>(`/findings/audit/${auditId}`);
    return response.data;
  },

  update: async (id: string, data: Partial<AuditFinding>) => {
    const response = await api.put<AuditFinding>(`/findings/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/findings/${id}`);
    return response.data;
  }
};
