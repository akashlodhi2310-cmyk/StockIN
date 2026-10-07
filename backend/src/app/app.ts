import express from 'express';
import cors from 'cors';
import { API_PREFIX } from '../config/constants';
import { env } from '../config/env';
import healthRoutes from '../routes/health.routes';
import platformRoutes from '../routes/platform.routes';
import adminRoutes from '../routes/admin.routes';
import subscriptionRoutes from '../routes/subscription.routes';
import { errorHandler } from '../middleware/error.middleware';

export function createApp(): express.Application {
  const app = express();

  const allowedOrigins = [
    env.frontendUrl,
    env.masterAdminUrl,
    'https://stock-in-eight.vercel.app',
    'https://stock-in-z5kr.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like health-checks, curl, mobile apps)
      if (!origin) return callback(null, true);
      const originBase = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some((ao) => {
        const aoBase = ao.replace(/\/$/, '');
        return originBase === aoBase || originBase.startsWith(aoBase) || aoBase.startsWith(originBase);
      });
      if (isAllowed || env.nodeEnv === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Public Health & Ping Routes
  app.use(API_PREFIX, healthRoutes);

  // Platform Policy & Client Config Routes (public)
  app.use(`${API_PREFIX}/platform`, platformRoutes);

  // Master Admin Protected Routes
  app.use(`${API_PREFIX}/admin`, adminRoutes);

  // User-facing Subscription & Payment Routes
  app.use(`${API_PREFIX}/subscription`, subscriptionRoutes);

  // Fallback 404
  app.use((_req: express.Request, res: express.Response) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
