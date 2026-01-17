import fs from 'fs';
import path from 'path';
import { AuditFinding } from './types';
import { randomUUID } from 'crypto';

export class ConfigAnalyzer {
  static async scan(projectPath: string): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // 1. Check for .env committed
    if (fs.existsSync(path.join(projectPath, '.env'))) {
        // Only a finding if it's NOT in gitignore? 
        // We can't easily check gitignore here without parsing it.
        // But usually, .env existing is fine, but we should warn to ensure it's not committed.
        // Let's check if .env.example exists.
        if (!fs.existsSync(path.join(projectPath, '.env.example'))) {
             findings.push({
                id: randomUUID(),
                title: 'Missing .env.example',
                description: 'A .env file exists but no .env.example found.',
                owaspCategory: 'A05:2021-Security Misconfiguration',
                owaspTop10: 'A05:2021-Security Misconfiguration',
                iso27001Control: 'A.5.1; A.8.32',
                nistCsfFunction: 'ID.AM; PR.DS',
                severity: 'LOW',
                impact: 'Developers might commit real .env files if no example is provided.',
                recommendation: 'Create a .env.example with dummy values.',
                affectedFileOrRoute: '.env',
                timestamp: new Date()
            });
        }
    }

    // 2. Check GitIgnore
    const gitIgnorePath = path.join(projectPath, '.gitignore');
    if (fs.existsSync(gitIgnorePath)) {
        const content = fs.readFileSync(gitIgnorePath, 'utf-8');
        if (!content.includes('.env')) {
             findings.push({
                id: randomUUID(),
                title: 'Sensitive Files Not Ignored',
                description: '.gitignore does not explicitly exclude .env',
                owaspCategory: 'A05:2021-Security Misconfiguration',
                owaspTop10: 'A05:2021-Security Misconfiguration',
                iso27001Control: 'A.5.1; A.8.32',
                nistCsfFunction: 'ID.AM; PR.DS',
                severity: 'HIGH',
                impact: 'Secrets may be accidentally committed to version control.',
                recommendation: 'Add .env to .gitignore immediately.',
                affectedFileOrRoute: '.gitignore',
                timestamp: new Date()
            });
        }
        if (!content.includes('node_modules')) {
             findings.push({
                id: randomUUID(),
                title: 'Dependencies Not Ignored',
                description: '.gitignore does not exclude node_modules',
                owaspCategory: 'A06:2021-Vulnerable and Outdated Components',
                owaspTop10: 'A06:2021-Vulnerable and Outdated Components',
                iso27001Control: 'A.5.30; A.8.28',
                nistCsfFunction: 'ID.AM; PR.IP',
                severity: 'LOW',
                impact: 'Repo size bloat and potential specific dependency lock-in issues.',
                recommendation: 'Add node_modules to .gitignore.',
                affectedFileOrRoute: '.gitignore',
                timestamp: new Date()
            });
        }
    } else {
        findings.push({
            id: randomUUID(),
            title: 'Missing .gitignore',
            description: 'No .gitignore file found in root.',
            owaspCategory: 'A05:2021-Security Misconfiguration',
            owaspTop10: 'A05:2021-Security Misconfiguration',
            iso27001Control: 'A.5.1; A.8.32',
            nistCsfFunction: 'ID.AM; PR.DS',
            severity: 'MEDIUM',
            impact: 'High risk of committing sensitive files and dependencies.',
            recommendation: 'Create a standard Node.js .gitignore file.',
            affectedFileOrRoute: 'ROOT',
            timestamp: new Date()
        });
    }

    return findings;
  }
}
