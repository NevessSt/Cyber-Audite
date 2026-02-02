import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, Clock, FolderPlus, Plus } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import type { DashboardMetrics } from '../services/dashboardService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await dashboardService.getOverview();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  const stats = metrics
    ? [
        { name: 'Active Audits', value: metrics.activeAudits, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
        { name: 'Critical Open Issues', value: metrics.criticalOpenFindings, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
        { name: 'Completed / Archived', value: metrics.completedAudits, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
        { name: 'Pending Review', value: metrics.pendingReviewAudits, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your security audits today.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading && (
          <div className="bg-white overflow-hidden shadow rounded-lg col-span-1 sm:col-span-2 lg:col-span-4">
            <div className="p-5 text-sm text-gray-500">Loading metrics...</div>
          </div>
        )}
        {!loading &&
          stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-md p-3 ${item.bg}`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{item.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/projects/new" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <FolderPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">New Project</h3>
              <p className="text-sm text-gray-500">Start a new client engagement</p>
            </div>
          </div>
        </Link>
        
        <Link to="/audits/new" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">New Audit Scan</h3>
              <p className="text-sm text-gray-500">Create a scan for an existing project</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
          <div className="mt-4 border-t border-gray-200">
            <p className="py-4 text-sm text-gray-500 italic">Activity feed coming in Phase 6...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
