import { PrismaClient, Role, Severity, FindingStatus, AuditStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const email = 'admin@example.com';
  const password = 'adminpassword';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  console.log(`User created: ${admin.email}`);

  // 2. Create Audit Project
  const project = await prisma.auditProject.create({
    data: {
      name: 'Sample Web App Audit',
      description: 'Internal security assessment of the legacy web portal.',
      clientName: 'Internal Ops',
      scope: 'Main Web Portal (https://portal.internal)',
      userId: admin.id,
    },
  });

  console.log(`Project created: ${project.name}`);

  // 3. Create Audit Scan
  const scan = await prisma.auditScan.create({
    data: {
      name: 'Initial Vulnerability Assessment',
      status: AuditStatus.IN_PROGRESS,
      projectId: project.id,
      auditorId: admin.id,
      scanScope: 'Authentication and Authorization modules',
      metadata: {
        environment: 'Staging',
        tools: ['Manual', 'Automated Scanner']
      }
    },
  });

  console.log(`Scan created: ${scan.name}`);

  // 4. Create Findings
  await prisma.auditFinding.createMany({
    data: [
      {
        title: 'Hardcoded API Keys in Client-Side Code',
        description: 'Found AWS Access Key ID in main.js bundle.',
        owaspCategory: 'A07:2021-Identification and Authentication Failures',
        severity: Severity.HIGH,
        impact: 'Attacker could access cloud resources.',
        recommendation: 'Move keys to backend environment variables.',
        affectedFileOrRoute: '/src/config.js',
        status: FindingStatus.OPEN,
        auditScanId: scan.id,
        createdById: admin.id,
      },
      {
        title: 'Missing Security Headers',
        description: 'X-Frame-Options and Content-Security-Policy headers are missing.',
        owaspCategory: 'A05:2021-Security Misconfiguration',
        severity: Severity.LOW,
        impact: 'Clickjacking potential.',
        recommendation: 'Configure Helmet middleware.',
        affectedFileOrRoute: 'Global Middleware',
        status: FindingStatus.OPEN,
        auditScanId: scan.id,
        createdById: admin.id,
      }
    ]
  });

  console.log('Findings created.');

  // 5. Create Report
  const report = await prisma.report.create({
    data: {
      title: 'Preliminary Security Audit Report',
      content: JSON.stringify({
        executiveSummary: 'This audit identified 2 key vulnerabilities affecting the platform security posture.',
        methodology: 'Hybrid assessment using automated scanning and manual code review.',
        findingsSummary: {
          critical: 0,
          high: 1,
          medium: 0,
          low: 1
        }
      }),
      auditScanId: scan.id,
      createdById: admin.id,
    }
  });

  console.log(`Report created: ${report.title}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
