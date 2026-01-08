import api from './api';

export interface Audit {
  id: string;
  name: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  projectId: string;
  auditorId: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    name: string;
    clientName: string;
  };
  auditor?: {
    name: string;
    email: string;
  };
}

export const auditService = {
  getAll: async () => {
    const response = await api.get<Audit[]>('/audits');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Audit>(`/audits/${id}`);
    return response.data;
  },

  create: async (data: { name: string; projectId: string; status: string }) => {
    const response = await api.post('/audits', data);
    return response.data;
  }
};
