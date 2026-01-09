import fs from 'fs';
import path from 'path';
import { AuditFinding } from './types';
import { v4 as uuidv4 } from 'uuid';

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
                id: uuidv4(),
                title: 'Missing .env.example',
                description: 'A .env file exists but no .env.example found.',
                owaspCategory: 'A05:2021-Security Misconfiguration',
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
                id: uuidv4(),
                title: 'Sensitive Files Not Ignored',
                description: '.gitignore does not explicitly exclude .env',
                owaspCategory: 'A05:2021-Security Misconfiguration',
                severity: 'HIGH',
                impact: 'Secrets may be accidentally committed to version control.',
                recommendation: 'Add .env to .gitignore immediately.',
                affectedFileOrRoute: '.gitignore',
                timestamp: new Date()
            });
        }
        if (!content.includes('node_modules')) {
             findings.push({
                id: uuidv4(),
                title: 'Dependencies Not Ignored',
                description: '.gitignore does not exclude node_modules',
                owaspCategory: 'A06:2021-Vulnerable and Outdated Components',
                severity: 'LOW',
                impact: 'Repo size bloat and potential specific dependency lock-in issues.',
                recommendation: 'Add node_modules to .gitignore.',
                affectedFileOrRoute: '.gitignore',
                timestamp: new Date()
            });
        }
    } else {
        findings.push({
            id: uuidv4(),
            title: 'Missing .gitignore',
            description: 'No .gitignore file found in root.',
            owaspCategory: 'A05:2021-Security Misconfiguration',
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
