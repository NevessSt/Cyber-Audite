import fs from 'fs';
import { AuditFinding } from './types';
import { walkFiles } from './utils/fileWalker';
import { v4 as uuidv4 } from 'uuid';

export class ApiSecurityAnalyzer {
  static async scan(projectPath: string): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];
    const files = walkFiles(projectPath);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      // 1. Check for Rate Limiting usage
      // This is a heuristic: check if rateLimit is imported but maybe not used, or if routes exist without it
      // For now, simple text check
      if (file.includes('express()') && !content.includes('rateLimit')) {
        findings.push({
          id: uuidv4(),
          title: 'Missing Rate Limiting',
          description: 'Express app initialized but no rate limiting middleware found in file.',
          owaspCategory: 'A04:2021-Insecure Design',
          severity: 'MEDIUM',
          impact: 'API is vulnerable to Brute Force and DoS attacks.',
          recommendation: 'Implement express-rate-limit globally or on sensitive routes.',
          affectedFileOrRoute: file.replace(projectPath, ''),
          timestamp: new Date()
        });
      }

      // 2. Check for SQL Injection patterns (raw queries)
      // "SELECT * FROM users WHERE id = " + req.body.id
      const sqlInjectionPattern = /["']SELECT\s+\*\s+FROM\s+.*["']\s*\+\s*req\./i;
      if (sqlInjectionPattern.test(content)) {
        findings.push({
          id: uuidv4(),
          title: 'Potential SQL Injection',
          description: 'Raw SQL query concatenation detected.',
          owaspCategory: 'A03:2021-Injection',
          severity: 'CRITICAL',
          impact: 'Attackers can manipulate queries to steal or destroy data.',
          recommendation: 'Use parameterized queries or an ORM like Prisma.',
          affectedFileOrRoute: file.replace(projectPath, ''),
          timestamp: new Date()
        });
      }

      // 3. Check for eval()
      if (content.includes('eval(')) {
        findings.push({
          id: uuidv4(),
          title: 'Dangerous Eval Usage',
          description: 'Usage of eval() detected.',
          owaspCategory: 'A03:2021-Injection',
          severity: 'CRITICAL',
          impact: 'Remote Code Execution (RCE) risk.',
          recommendation: 'Remove eval() immediately.',
          affectedFileOrRoute: file.replace(projectPath, ''),
          timestamp: new Date()
        });
      }
      
      // 4. Check for console.log in production (Info/Low)
      if (content.includes('console.log(')) {
         findings.push({
          id: uuidv4(),
          title: 'Console Log Leftover',
          description: 'console.log statements found.',
          owaspCategory: 'A09:2021-Security Logging and Monitoring Failures',
          severity: 'LOW',
          impact: 'Logs might leak sensitive info or clutter production logs.',
          recommendation: 'Remove console.log or use a proper logger.',
          affectedFileOrRoute: file.replace(projectPath, ''),
          timestamp: new Date()
        });
      }
    }

    return findings;
  }
}
