import api from './api';

export interface DashboardMetrics {
  totalAudits: number;
  activeAudits: number;
  completedAudits: number;
  pendingReviewAudits: number;
  severityCounts: Record<string, number>;
  criticalOpenFindings: number;
}

export const dashboardService = {
  getOverview: async () => {
    const response = await api.get<DashboardMetrics>('/dashboard/overview');
    return response.data;
  },
};

