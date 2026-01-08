import api from './api';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string | null;
  createdAt: string;
}

export const projectService = {
  create: async (data: { name: string; clientName: string; description?: string }) => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  }
};
