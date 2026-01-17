import fs from 'fs';
import { AuditFinding } from './types';
import { walkFiles } from './utils/fileWalker';
import { randomUUID } from 'crypto';

export class AuthAnalyzer {
  static async scan(projectPath: string): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];
    const files = walkFiles(projectPath);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // 1. Check for Hardcoded Secrets
      const secretPatterns = [
        /const\s+SECRET\s*=\s*['"][a-zA-Z0-9]{10,}['"]/,
        /process\.env\.JWT_SECRET\s*\|\|\s*['"][a-zA-Z0-9]+['"]/, // Fallback to hardcoded
        /password\s*=\s*['"]123456['"]/
      ];

      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          findings.push({
            id: randomUUID(),
            title: 'Hardcoded Secret Detected',
            description: `A potential hardcoded secret or weak fallback was found matching pattern: ${pattern}`,
            owaspCategory: 'A07:2021-Identification and Authentication Failures',
            owaspTop10: 'A07:2021-Identification and Authentication Failures',
            iso27001Control: 'A.5.15; A.8.2',
            nistCsfFunction: 'PR.AC; PR.DS',
            severity: 'CRITICAL',
            impact: 'Compromise of this secret allows attackers to forge tokens or access protected data.',
            recommendation: 'Use environment variables for all secrets. Remove hardcoded fallbacks.',
            affectedFileOrRoute: file.replace(projectPath, ''),
            timestamp: new Date()
          });
        }
      });

      // 2. Check for Weak Hashing
      if (content.includes('crypto.createHash(\'md5\')') || content.includes('crypto.createHash(\'sha1\')')) {
        findings.push({
          id: randomUUID(),
          title: 'Weak Hashing Algorithm',
          description: 'Usage of MD5 or SHA1 detected.',
          owaspCategory: 'A02:2021-Cryptographic Failures',
          owaspTop10: 'A02:2021-Cryptographic Failures',
          iso27001Control: 'A.5.13; A.8.24',
          nistCsfFunction: 'PR.DS',
          severity: 'HIGH',
          impact: 'These algorithms are collision-prone and should not be used for security.',
          recommendation: 'Use SHA-256 or higher for hashing.',
          affectedFileOrRoute: file.replace(projectPath, ''),
          timestamp: new Date()
        });
      }

      // 3. Check for Basic Auth
      if (content.includes('BasicStrategy')) {
         findings.push({
            id: randomUUID(),
            title: 'Basic Authentication Detected',
            description: 'Usage of HTTP Basic Auth detected.',
            owaspCategory: 'A07:2021-Identification and Authentication Failures',
            owaspTop10: 'A07:2021-Identification and Authentication Failures',
            iso27001Control: 'A.5.15; A.8.23',
            nistCsfFunction: 'PR.AC',
            severity: 'LOW',
            impact: 'Basic Auth credentials are sent in base64. Ensure HTTPS is enforced.',
            recommendation: 'Ensure TLS is used. Consider upgrading to Token-based auth.',
            affectedFileOrRoute: file.replace(projectPath, ''),
            timestamp: new Date()
          });
      }
    }

    return findings;
  }
}
