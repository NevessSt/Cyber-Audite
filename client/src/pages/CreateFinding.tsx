import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { findingService } from '../services/findingService';
import { aiService } from '../services/aiService';
import { Sparkles } from 'lucide-react';

const CreateFinding: React.FC = () => {
  const { id: auditId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null); // 'description' | 'remediation' | null
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    remediation: '',
    affectedResource: '',
    cvssScore: '',
    severity: 'MEDIUM',
    status: 'OPEN'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAiRefine = async () => {
    if (!formData.description) return;
    setAiLoading('description');
    try {
      const refined = await aiService.refineText(formData.description);
      setFormData(prev => ({ ...prev, description: refined }));
    } catch (error) {
      console.error('AI Error:', error);
      alert('Failed to refine text');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiRemediate = async () => {
    if (!formData.title || !formData.description) return;
    setAiLoading('remediation');
    try {
      const remediation = await aiService.suggestRemediation(formData.title, formData.description);
      setFormData(prev => ({ ...prev, remediation }));
    } catch (error) {
      console.error('AI Error:', error);
      alert('Failed to generate remediation');
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditId) return;

    setLoading(true);
    try {
      await findingService.create({
        ...formData,
        cvssScore: formData.cvssScore ? parseFloat(formData.cvssScore) : undefined,
        auditId,
        severity: formData.severity as any,
      });
      navigate(`/audits/${auditId}`);
    } catch (error) {
      console.error('Error creating finding:', error);
      alert('Failed to create finding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Finding</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Severity</label>
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">CVSS Score (0-10)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            name="cvssScore"
            value={formData.cvssScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Affected Resource (URL/Path)</label>
          <input
            type="text"
            name="affectedResource"
            value={formData.affectedResource}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <button
              type="button"
              onClick={handleAiRefine}
              disabled={aiLoading === 'description' || !formData.description}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {aiLoading === 'description' ? 'Refining...' : 'AI Refine'}
            </button>
          </div>
          <textarea
            name="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Remediation</label>
            <button
              type="button"
              onClick={handleAiRemediate}
              disabled={aiLoading === 'remediation' || !formData.title}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {aiLoading === 'remediation' ? 'Generating...' : 'AI Suggest'}
            </button>
          </div>
          <textarea
            name="remediation"
            rows={4}
            value={formData.remediation}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/audits/${auditId}`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Create Finding'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFinding;
