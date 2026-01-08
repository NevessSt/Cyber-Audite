# CyberAudit - Professional Internal Audit Tool

A secure, private cybersecurity audit management platform designed for professional auditors.
Built with React (Frontend), Node.js (Backend), and PostgreSQL (Database).

## Features

- **Project Management**: Organize audits by Client/Project.
- **Audit Workflows**: Create, manage, and track security audits.
- **Finding Management**: Document vulnerabilities with CVSS scores and severity.
- **AI Assistance**: Integrated ChatGPT for refining risk descriptions and suggesting remediations (Risk Explanation ONLY).
- **Automated Reporting**: Generate PDF reports with executive summaries.
- **Role-Based Access Control (RBAC)**: Strict separation between ADMIN and AUDITOR roles.
- **Audit Trails**: Comprehensive logging of all user actions (Login, Create, Update, Delete).
- **Security Hardening**:
  - Secure Password Hashing (Bcrypt 12 rounds)
  - JWT Authentication
  - IDOR Prevention (Resource Ownership Checks)
  - Environment Variable Validation

## Architecture

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: PostgreSQL (via Docker).
- **ORM**: Prisma.
- **Security**: Helmet, CORS, Bcrypt, JWT, Input Validation.

## Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL (if not using Docker)

### 2. Environment Configuration
Create a `.env` file in the `server` directory:

```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/cyber_audit?schema=public"
JWT_SECRET="your-super-secure-secret-key-at-least-32-chars"
OPENAI_API_KEY="your-openai-key-optional"
```

### 3. Database Setup (Docker)
Start the PostgreSQL container:

```bash
cd server
docker-compose up -d
```

### 4. Database Migration
Apply the database schema:

```bash
cd server
npm install
npx prisma migrate dev --name init
```

### 5. Run Backend
```bash
cd server
npm run dev
```

### 6. Run Frontend
```bash
cd client
npm install
npm run dev
```

## User Roles

- **ADMIN**: Full access to all projects, audits, users, and system logs. Can manage user roles.
- **AUDITOR**: Can create projects and audits. Can only view/edit their own audits (or assigned ones).

## Security Notes

- **Private Tool**: Designed for internal use. Do not expose public registration in production without additional safeguards (e.g., Admin Approval).
- **Audit Logs**: All critical actions are logged to the `AuditLog` table and viewable by Admins.
