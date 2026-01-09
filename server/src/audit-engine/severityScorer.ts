import { Severity } from './types';

export class SeverityScorer {
  /**
   * Calculates severity based on OWASP Impact and Likelihood
   * This is a simplified deterministic model.
   */
  static score(owaspCategory: string, impactLevel: 'high' | 'medium' | 'low'): Severity {
    // Critical categories often related to RCE, Injection, or Broken Auth with high impact
    if (
      (owaspCategory.includes('Injection') || owaspCategory.includes('Broken Access Control')) &&
      impactLevel === 'high'
    ) {
      return 'CRITICAL';
    }

    if (impactLevel === 'high') {
      return 'HIGH';
    }

    if (impactLevel === 'medium') {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  static calculateRiskScore(findings: { severity: Severity }[]): number {
    let score = 0;
    for (const finding of findings) {
      switch (finding.severity) {
        case 'CRITICAL': score += 10; break;
        case 'HIGH': score += 5; break;
        case 'MEDIUM': score += 2; break;
        case 'LOW': score += 1; break;
      }
    }
    return score;
  }
}
