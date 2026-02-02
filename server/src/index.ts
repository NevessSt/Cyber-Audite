import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env'; // Validate env on import
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
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = env.PORT;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN || env.CLIENT_URL, // Strict CORS
  credentials: true,
}));

// Request Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json());

// Rate Limiting
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/findings', findingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', pdfRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/risk', riskRoutes);

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling Middleware (MUST be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
