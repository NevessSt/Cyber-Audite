import api from './api';

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  owaspCategory: string;
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

export const findingService = {
  create: async (data: any) => {
    const response = await api.post('/findings', data);
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
    const response = await api.put(`/findings/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/findings/${id}`);
    return response.data;
  }
};
