import api from './api';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'AUDITOR';
  createdAt: string;
}

export const userService = {
  getAll: async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  updateRole: async (userId: string, role: 'ADMIN' | 'AUDITOR') => {
    const response = await api.patch<User>(`/users/${userId}/role`, { role });
    return response.data;
  }
};
