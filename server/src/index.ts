import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateEnv } from './config/env';
import userRoutes from './routes/userRoutes';
import auditRoutes from './routes/auditRoutes';
import findingRoutes from './routes/findingRoutes';
import reportRoutes from './routes/reportRoutes';
import aiRoutes from './routes/aiRoutes';
import pdfRoutes from './routes/pdfRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import projectRoutes from './routes/projectRoutes';

// Load env vars
dotenv.config();

// Validate Environment Variables
validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/findings', findingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', pdfRoutes); // Note: /api/reports/:id/pdf handled here
app.use('/api/audit-logs', auditLogRoutes);

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
