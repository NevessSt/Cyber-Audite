import api from './api';

export interface RiskSummary {
  audit: {
    id: string;
    name: string;
    status: string;
  };
  riskScore: number | null;
  severityCounts: Record<string, number>;
  owaspTop10: { category: string; count: number }[];
  iso27001Controls: string[];
  nistCsfFunctions: string[];
}

export const riskService = {
  getSummary: async (auditId: string) => {
    const response = await api.get<RiskSummary>(`/risk/audits/${auditId}/summary`);
    return response.data;
  },
};

