# CyberAudit - Professional Internal Audit Tool

A secure, private cybersecurity audit management platform designed for professional auditors.
Built with React (Frontend), Node.js (Backend), and PostgreSQL (Database).

## 🚀 Quick Start (Docker)

The easiest way to run the application is using Docker Compose.

### 1. Prerequisites
- **Docker & Docker Compose**: Ensure Docker Desktop is running (works on Windows/Mac/Linux).

### 2. Environment Setup
Copy the example environment files:
```bash
# From project root
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**Required Configuration (`server/.env`):**
- `DATABASE_URL`: Pre-configured for Docker (`postgresql://user:password@postgres:5432/cyber_audit`).
- `JWT_SECRET`: Change this to a secure random string (min 32 chars).
- `OPENAI_API_KEY` (Optional): Set your OpenAI key for AI risk explanations. If missing, AI features will be disabled (HTTP 503).

### 3. Run Application
Start the full stack (Database + API + Frontend + Proxy):
```bash
docker compose up -d --build
```

**Verification:**
- **Frontend**: [http://localhost](http://localhost) (via Caddy Proxy)
- **API Health**: [http://localhost/api/health](http://localhost/api/health)
- **Database**: Port `5432` exposed locally.

### 4. Default Credentials (Seeded)
The application automatically seeds a default admin user on first run:
- **Email**: `admin@example.com`
- **Password**: `adminpassword`

---

## 🛠 Manual Development

If you want to run services individually without Docker Compose:

### Backend (`/server`)
1.  **Install**: `npm install`
2.  **Database**: Start a local Postgres or use the dev-db helper:
    ```bash
    docker compose -f docker-compose.dev-db.yml up -d
    ```
3.  **Env**: Update `.env` to point to localhost DB.
4.  **Migrate & Seed**:
    ```bash
    npm run db:migrate  # Run migrations
    npm run db:seed     # Seed demo data
    ```
5.  **Start**:
    ```bash
    npm run dev         # Start with nodemon
    ```

### Frontend (`/client`)
1.  **Install**: `npm install`
2.  **Start**:
    ```bash
    npm run dev         # Starts on http://localhost:5173
    ```

---

## 🔒 Security Features

- **Strict Environment Validation**: Server fails fast if required env vars (DB URL, JWT Secret) are missing.
- **Reverse Proxy**: Caddy handles routing and can be configured for TLS.
- **Security Headers**: `Helmet` configured for security best practices.
- **Rate Limiting**: Strict limits on `/auth/login` and `/auth/register` to prevent brute-force.
- **Input Validation**: `Zod` used for environment and request validation.
- **CORS**: Strict CORS policy enforced via `CORS_ORIGIN`.

## 📂 Project Structure

- `docker-compose.yml`: Main production-ready composition.
- `server/docker-compose.dev-db.yml`: Helper to run *only* the database for local dev.
- `server/`: Node.js Express API.
- `client/`: React + Vite Frontend.
- `Caddyfile`: Reverse proxy configuration.

## ⚠️ Troubleshooting

- **AI Not Working?** Ensure `OPENAI_API_KEY` is set in `server/.env`.
- **Database Connection Error?** Ensure the postgres container is healthy.
- **Ports in Use?** The app uses ports `80` (Client/Proxy), `3001` (Server), and `5432` (DB).
