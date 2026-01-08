import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { projectService, Project } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import { Plus } from 'lucide-react';

const CreateAudit: React.FC = () => {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getAll();
        setProjects(data);
        if (data.length > 0) {
          setProjectId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch projects', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      alert('Please select a project');
      return;
    }
    try {
      await api.post('/audits', {
        name,
        projectId,
        auditorId: user?.id,
      });
      navigate('/audits');
    } catch (error) {
      console.error('Failed to create audit:', error);
    }
  };

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Audit</h2>
        <Link to="/projects/new" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Project
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Audit Name</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q1 Security Assessment"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Project / Client</label>
          {projects.length > 0 ? (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.clientName} - {p.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 p-4 bg-yellow-50 text-yellow-700 rounded-md text-sm border border-yellow-200">
              No projects found. You need to create a project first.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/audits')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!projectId}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Audit
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAudit;
