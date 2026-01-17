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
import { riskService } from '../services/riskService';
import type { RiskSummary } from '../services/riskService';

const AuditDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [textFilter, setTextFilter] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [auditData, findingsData, reportsData, riskData] = await Promise.all([
          auditService.getById(id),
          findingService.getByAudit(id),
          reportService.getByAudit(id),
          riskService.getSummary(id),
        ]);
        setAudit(auditData);
        setFindings(findingsData);
        setReports(reportsData);
        setRiskSummary(riskData);
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

  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;

    if (!textFilter.trim()) return true;
    const q = textFilter.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.owaspCategory.toLowerCase().includes(q) ||
      (f.owaspTop10 && f.owaspTop10.toLowerCase().includes(q)) ||
      (f.affectedFileOrRoute && f.affectedFileOrRoute.toLowerCase().includes(q))
    );
  });

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

      {riskSummary && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Risk Overview</h2>
            {riskSummary.riskScore !== null && (
              <span className="text-sm text-gray-600">Risk Score: {riskSummary.riskScore.toFixed(2)}</span>
            )}
          </div>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="text-xs font-medium text-gray-500">Critical</div>
              <div className="text-xl font-semibold text-red-700">
                {riskSummary.severityCounts.CRITICAL ?? 0}
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="text-xs font-medium text-gray-500">High</div>
              <div className="text-xl font-semibold text-orange-600">
                {riskSummary.severityCounts.HIGH ?? 0}
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="text-xs font-medium text-gray-500">Medium</div>
              <div className="text-xl font-semibold text-yellow-600">
                {riskSummary.severityCounts.MEDIUM ?? 0}
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="text-xs font-medium text-gray-500">Low</div>
              <div className="text-xl font-semibold text-blue-600">
                {riskSummary.severityCounts.LOW ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Overview */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Compliance Coverage</h2>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold mb-2">OWASP Top 10</h3>
            {findings.length === 0 ? (
              <p className="text-gray-500 text-sm">No findings yet.</p>
            ) : (
              <ul className="space-y-1">
                {Array.from(
                  findings.reduce<Map<string, number>>((map, f) => {
                    const key = f.owaspTop10 || f.owaspCategory;
                    const current = map.get(key) ?? 0;
                    map.set(key, current + 1);
                    return map;
                  }, new Map()),
                ).map(([category, count]) => (
                  <li key={category} className="flex justify-between">
                    <span className="font-mono text-xs">{category}</span>
                    <span className="text-xs text-gray-500">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">ISO 27001 Controls</h3>
            {findings.length === 0 ? (
              <p className="text-gray-500 text-sm">No findings yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(
                    findings
                      .map((f) => f.iso27001Control)
                      .filter((c): c is string => !!c),
                  ),
                ).map((control) => (
                  <li
                    key={control}
                    className="px-2 py-1 bg-gray-100 rounded text-xs font-mono"
                  >
                    {control}
                  </li>
                ))}
                {findings.every((f) => !f.iso27001Control) && (
                  <p className="text-gray-500 text-sm">No ISO mappings yet.</p>
                )}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">NIST CSF Functions</h3>
            {findings.length === 0 ? (
              <p className="text-gray-500 text-sm">No findings yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(
                    findings
                      .map((f) => f.nistCsfFunction)
                      .filter((c): c is string => !!c),
                  ),
                ).map((func) => (
                  <li
                    key={func}
                    className="px-2 py-1 bg-gray-100 rounded text-xs font-mono"
                  >
                    {func}
                  </li>
                ))}
                {findings.every((f) => !f.nistCsfFunction) && (
                  <p className="text-gray-500 text-sm">No NIST mappings yet.</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Findings Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-medium text-gray-900">Findings</h2>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="flex-1">
              <input
                type="text"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                placeholder="Filter by title, description, OWASP, path..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All status</option>
                <option value="OPEN">Open</option>
                <option value="IN_REVIEW">In review</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FALSE_POSITIVE">False positive</option>
                <option value="FIXED">Fixed</option>
                <option value="ACCEPTED_RISK">Accepted risk</option>
              </select>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-gray-200">
          {filteredFindings.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">No findings match current filters.</li>
          ) : (
            filteredFindings.map((finding) => (
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
                      {finding.owaspTop10 && (
                        <p className="text-xs text-gray-500 font-mono">OWASP Top 10: {finding.owaspTop10}</p>
                      )}
                      {(finding.iso27001Control || finding.nistCsfFunction) && (
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {finding.iso27001Control && <span>ISO 27001: {finding.iso27001Control}</span>}
                          {finding.iso27001Control && finding.nistCsfFunction && <span> • </span>}
                          {finding.nistCsfFunction && <span>NIST CSF: {finding.nistCsfFunction}</span>}
                        </p>
                      )}
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
