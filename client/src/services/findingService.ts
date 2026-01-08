import api from './api';

export interface Finding {
  id: string;
  title: string;
  description: string;
  remediation?: string;
  affectedResource?: string;
  cvssScore?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status: 'OPEN' | 'REMEDIATED' | 'ACCEPTED' | 'FALSE_POSITIVE';
  auditId: string;
  createdAt: string;
  updatedAt: string;
}

export const findingService = {
  create: async (data: Omit<Finding, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const response = await api.post('/findings', data);
    return response.data;
  },

  getByAudit: async (auditId: string) => {
    const response = await api.get<Finding[]>(`/findings/audit/${auditId}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Finding>) => {
    const response = await api.put(`/findings/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/findings/${id}`);
    return response.data;
  }
};
