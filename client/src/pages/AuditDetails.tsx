import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auditService } from '../services/auditService';
import type { Audit } from '../services/auditService';
import { findingService } from '../services/findingService';
import type { Finding } from '../services/findingService';
import { reportService } from '../services/reportService';
import type { Report } from '../services/reportService';
import { Plus, FileText, ArrowLeft, Download } from 'lucide-react';
import api from '../services/api';

const AuditDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [auditData, findingsData, reportsData] = await Promise.all([
          auditService.getById(id),
          findingService.getByAudit(id),
          reportService.getByAudit(id)
        ]);
        setAudit(auditData);
        setFindings(findingsData);
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching audit details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleGenerateReport = async () => {
    if (!id) return;
    try {
      const newReport = await reportService.generate(id);
      setReports([newReport, ...reports]);
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/reports/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!audit) return <div>Audit not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/audits" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{audit.name}</h1>
            <p className="text-sm text-gray-500">
              {audit.project?.clientName} • {audit.status}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <Link
            to={`/audits/${id}/findings/new`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Finding
          </Link>
        </div>
      </div>

      {/* Findings Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Findings</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {findings.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">No findings recorded yet.</li>
          ) : (
            findings.map((finding) => (
              <li key={finding.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${finding.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 
                        finding.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                        finding.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {finding.severity}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{finding.title}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">{finding.owaspCategory}</p>
                      <p className="text-sm text-gray-500 mt-1">{finding.description}</p>
                      
                      <div className="mt-2 text-sm">
                        <p><span className="font-medium text-gray-700">Impact:</span> {finding.impact}</p>
                        <p><span className="font-medium text-gray-700">File/Route:</span> <code className="bg-gray-100 px-1 rounded">{finding.affectedFileOrRoute}</code></p>
                        <div className="mt-1">
                          <span className="font-medium text-gray-700">Recommendation:</span>
                          <p className="mt-1 text-gray-600 bg-gray-50 p-2 rounded text-sm">{finding.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 self-start">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      finding.status === 'OPEN' ? 'bg-red-50 text-red-700 border-red-200' :
                      finding.status === 'FIXED' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {finding.status}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Reports Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Reports</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {reports.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">No reports generated yet.</li>
          ) : (
            reports.map((report) => (
              <li key={report.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">View</button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default AuditDetails;
