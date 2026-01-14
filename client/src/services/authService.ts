import api from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post<LoginResponse>('/users/login', credentials);
    return response.data;
  },

  register: async (data: { email: string; password: string; name?: string }) => {
    const response = await api.post<RegisterResponse>('/users/register', data);
    return response.data;
  },

  refreshToken: async (token: string) => {
    const response = await api.post<{ accessToken: string }>('/users/refresh-token', { refreshToken: token });
    return response.data;
  },

  logout: async () => {
    return api.post('/users/logout');
  }
};
