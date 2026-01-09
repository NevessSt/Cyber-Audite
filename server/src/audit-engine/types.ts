export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  owaspCategory: string;
  severity: Severity;
  impact: string;
  recommendation: string;
  affectedFileOrRoute: string;
  timestamp: Date;
}

export interface AuditScanResult {
  timestamp: Date;
  findings: AuditFinding[];
  riskScore: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
