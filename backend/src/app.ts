import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';

import { env } from './config/env';
import { requestId } from './middleware/requestId';
import { securityHeaders } from './middleware/securityHeaders';
import { publicLimiter } from './middleware/rateLimit';

import studentAuthRouter from './routes/auth.student';
import adminAuthRouter from './routes/auth.admin';
import eventsRouter from './routes/events';
import registrationsRouter from './routes/registrations';
import adminRouter from './routes/admin';

export const app = express();
app.set('trust proxy', 1);

// ─── 1. Request ID (first — needed in all middleware) ─────────────────────────
app.use(requestId);

// ─── 2. Helmet security headers ───────────────────────────────────────────────
app.use(securityHeaders);

// ─── 3. CORS — strict allowlist ───────────────────────────────────────────────
const allowedOrigins = [
  env.FRONTEND_ORIGIN.replace(/\/$/, ''),
  env.ADMIN_ORIGIN.replace(/\/$/, ''),
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
];

const isDev = env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.includes(cleanOrigin) ||
      (isDev && (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|localhost)(:\d+)?$/).test(cleanOrigin));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy blocked origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// ─── 4. Cookie parser ─────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── 5. Body parsing — 100kb limit, disable X-Powered-By ─────────────────────
app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── 6. HTTP Parameter Pollution prevention ───────────────────────────────────
app.use(hpp());

// ─── 7. Global rate limit ─────────────────────────────────────────────────────
app.use(publicLimiter);

// ─── 8. Health check & Welcome endpoints ─────────────────────────────────────
app.get(['/', '/api/v1'], (_req, res) => {
  res.json({ success: true, message: 'CodeVed API v1 is live and operational 🚀', timestamp: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 9. Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', studentAuthRouter);
app.use('/api/v1/admin/auth', adminAuthRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/registrations', registrationsRouter);
app.use('/api/v1/admin', adminRouter);

// ─── 10. 404 handler ─────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found.' });
});

// ─── 11. Global error handler ─────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isDev = env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: 'Internal server error.',
    ...(isDev && { details: err.message }),
  });
});

export default app;
