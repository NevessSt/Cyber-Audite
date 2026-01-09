import { DependencyScanner } from './dependencyScanner';
import { AuthAnalyzer } from './authAnalyzer';
import { ApiSecurityAnalyzer } from './apiSecurityAnalyzer';
import { ConfigAnalyzer } from './configAnalyzer';
import { SeverityScorer } from './severityScorer';
import { AuditFinding, AuditScanResult } from './types';

export class AuditEngine {
  static async runScan(projectPath: string): Promise<AuditScanResult> {
    console.log(`Starting audit scan for: ${projectPath}`);
    
    const findings: AuditFinding[] = [];

    // Run all analyzers
    const depFindings = await DependencyScanner.scan(projectPath);
    const authFindings = await AuthAnalyzer.scan(projectPath);
    const apiFindings = await ApiSecurityAnalyzer.scan(projectPath);
    const configFindings = await ConfigAnalyzer.scan(projectPath);

    findings.push(...depFindings, ...authFindings, ...apiFindings, ...configFindings);

    // Calculate Risk Score
    const riskScore = SeverityScorer.calculateRiskScore(findings);
    
    // Summarize
    const summary = {
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
    };

    return {
      timestamp: new Date(),
      findings,
      riskScore,
      summary
    };
  }
}

export * from './types';
