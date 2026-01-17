import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateEnv } from './config/env';
import { apiLimiter, authLimiter } from './middleware/rateLimit';
import userRoutes from './routes/userRoutes';
import auditRoutes from './routes/auditRoutes';
import findingRoutes from './routes/findingRoutes';
import reportRoutes from './routes/reportRoutes';
import aiRoutes from './routes/aiRoutes';
import pdfRoutes from './routes/pdfRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import projectRoutes from './routes/projectRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import riskRoutes from './routes/riskRoutes';

// Load env vars
dotenv.config();

// Validate Environment Variables
validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rate Limiting
app.use('/api', apiLimiter); // Apply general limit to all API routes
app.use('/api/users/login', authLimiter); // Stricter limit for login
app.use('/api/users/register', authLimiter); // Stricter limit for register

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/findings', findingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', pdfRoutes); // Note: /api/reports/:id/pdf handled here
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/risk', riskRoutes);

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling Middleware (MUST be last)
import { errorHandler } from './middleware/errorHandler';
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
