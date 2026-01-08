import api from './api';

export interface Report {
  id: string;
  title: string;
  content: string;
  auditId: string;
  createdAt: string;
}

export const reportService = {
  generate: async (auditId: string) => {
    const response = await api.post('/reports/generate', { auditId });
    return response.data;
  },

  getByAudit: async (auditId: string) => {
    const response = await api.get<Report[]>(`/reports/audit/${auditId}`);
    return response.data;
  }
};
