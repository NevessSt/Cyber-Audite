import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { findingService } from '../services/findingService';
import { aiService } from '../services/aiService';
import { Sparkles } from 'lucide-react';

const OWASP_CATEGORIES = [
  'A01:2021-Broken Access Control',
  'A02:2021-Cryptographic Failures',
  'A03:2021-Injection',
  'A04:2021-Insecure Design',
  'A05:2021-Security Misconfiguration',
  'A06:2021-Vulnerable and Outdated Components',
  'A07:2021-Identification and Authentication Failures',
  'A08:2021-Software and Data Integrity Failures',
  'A09:2021-Security Logging and Monitoring Failures',
  'A10:2021-Server-Side Request Forgery (SSRF)',
  'Other'
];

const CreateFinding: React.FC = () => {
  const { id: auditId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    recommendation: '',
    affectedFileOrRoute: '',
    owaspCategory: 'A01:2021-Broken Access Control',
    severity: 'MEDIUM',
    impact: '',
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

  const handleAiRecommendation = async () => {
    if (!formData.title || !formData.description) return;
    setAiLoading('recommendation');
    try {
      const recommendation = await aiService.suggestRemediation(formData.title, formData.description);
      setFormData(prev => ({ ...prev, recommendation }));
    } catch (error) {
      console.error('AI Error:', error);
      alert('Failed to generate recommendation');
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
        auditScanId: auditId,
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

        <div className="grid grid-cols-2 gap-4">
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
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">OWASP Category</label>
            <select
              name="owaspCategory"
              value={formData.owaspCategory}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            >
              {OWASP_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Affected File/Route</label>
          <input
            type="text"
            name="affectedFileOrRoute"
            value={formData.affectedFileOrRoute}
            onChange={handleChange}
            placeholder="/src/controllers/auth.ts or /api/login"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Impact</label>
            <textarea
              name="impact"
              rows={2}
              value={formData.impact}
              onChange={handleChange}
              placeholder="What is the business or security impact?"
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
            <label className="block text-sm font-medium text-gray-700">Recommendation</label>
            <button
              type="button"
              onClick={handleAiRecommendation}
              disabled={aiLoading === 'recommendation' || !formData.title}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {aiLoading === 'recommendation' ? 'Generating...' : 'AI Suggest'}
            </button>
          </div>
          <textarea
            name="recommendation"
            rows={4}
            value={formData.recommendation}
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
