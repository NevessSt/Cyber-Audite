import api from './api';

export const aiService = {
  refineText: async (text: string) => {
    const response = await api.post<{ refined: string }>('/ai/refine', { text });
    return response.data.refined;
  },

  suggestRemediation: async (title: string, description: string) => {
    const response = await api.post<{ remediation: string }>('/ai/remediate', { title, description });
    return response.data.remediation;
  }
};
