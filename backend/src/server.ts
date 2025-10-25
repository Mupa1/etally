/**
 * Election Management System - Backend Server
 * Main entry point for the API server
 */

import 'dotenv/config';
import 'express-async-errors';
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

// Infrastructure
import PrismaService from '@/infrastructure/database/prisma.service';
import RedisService from '@/infrastructure/cache/redis.service';
import {
  errorHandler,
  notFoundHandler,
} from '@/infrastructure/middleware/error.middleware';

// Routes
import authRouter from '@/domains/auth/auth.routes';
import electionRouter from '@/domains/elections/election.routes';
import policyRouter from '@/domains/policies/policy.routes';
import geographicRouter from '@/domains/geographic/geographic.routes';
import configurationRouter from '@/domains/configurations/configuration.routes';
import partyRouter from '@/domains/parties/party.routes';
import observerMobileRoutes from '@/domains/mobile/observer-mobile.routes';
import observerAdminRoutes from '@/domains/mobile/observer-admin.routes';
import observerApplicationsRoutes from '@/domains/mobile/observer-applications.routes';
import { createObserverRoutes } from '@/domains/mobile/observer.routes';
import { ObserverService } from '@/domains/mobile/observer.service';
import { ObserverMinIOService } from '@/domains/mobile/minio.service';
import { EmailService } from '@/domains/mobile/email.service';
import emailTemplateRoutes from '@/domains/communication/email-template.routes';

// Server configuration
const app: Application = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==========================================
// MIDDLEWARE
// ==========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:80'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// API version endpoint
app.get('/api', (_req, res) => {
  res.status(200).json({
    name: 'Election Management System API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Initialize observer services
const observerMinIOService = new ObserverMinIOService();
const emailService = new EmailService();
const observerService = new ObserverService(
  PrismaService.getInstance(),
  observerMinIOService,
  emailService
);

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/elections', electionRouter);
app.use('/api/v1/geographic', geographicRouter); // Geographic data management
app.use('/api/v1/configurations', configurationRouter); // System configuration management
app.use('/api/v1/parties', partyRouter); // Political party management
app.use('/api/v1', policyRouter); // Policy management (scopes, permissions, audit)
app.use('/api/v1/observers/mobile', observerMobileRoutes); // Mobile PWA observer routes
app.use('/api/v1/admin/observers', observerAdminRoutes); // Admin observer management
app.use('/api/v1/admin/observer-applications', observerApplicationsRoutes); // Observer applications management
app.use('/api/v1/communication/templates', emailTemplateRoutes); // Email template management

// Agent routes (public registration endpoints)
app.use('/api/agent', createObserverRoutes(observerService));
// TODO: Add more routes
// app.use('/api/v1/results', resultRouter);
// app.use('/api/v1/candidates', candidateRouter);
// etc...

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ==========================================
// SERVER START
// ==========================================

const startServer = async () => {
  try {
    // Connect to database
    const prisma = PrismaService.getInstance();
    await prisma.connect();

    // Connect to Redis
    const redis = RedisService.getInstance();
    const redisHealthy = await redis.healthCheck();
    if (!redisHealthy) {
      console.warn('⚠️  Redis connection failed, continuing without cache');
    }

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Election Management System - API Server          ║
║                                                           ║
║   Environment: ${NODE_ENV.padEnd(43)}║
║   Port:        ${PORT.toString().padEnd(43)}║
║   Status:      Running ✓                                 ║
║   Database:    Connected ✓                               ║
║   Redis:       ${(redisHealthy ? 'Connected ✓' : 'Disconnected ⚠️').padEnd(47)}║
║                                                           ║
║   API Docs:    http://localhost:${PORT}/api             ║
║   Health:      http://localhost:${PORT}/health          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} signal received: closing HTTP server gracefully`);

  try {
    // Close database connection
    const prisma = PrismaService.getInstance();
    await prisma.disconnect();

    // Close Redis connection
    const redis = RedisService.getInstance();
    await redis.disconnect();

    console.log('All connections closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

export default app;
