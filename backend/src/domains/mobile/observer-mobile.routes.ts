/**
 * Mobile PWA Observer Routes
 * HTTP routes for observer self-service and mobile PWA functionality
 * Mix of public and authenticated routes for observer registration and management
 */

import { Router } from 'express';
import { ObserverController } from './observer.controller';
import { ObserverService } from './observer.service';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRoles } from '@/domains/auth/auth.middleware';
import { rateLimiter } from '@/infrastructure/middleware/rate-limit.middleware';
import multer from 'multer';

const router = Router();
const prisma = new PrismaClient();
const emailService = new (require('./email.service').EmailService)();
const minioService = new (require('./minio.service').ObserverMinIOService)();
const observerService = new ObserverService(prisma, minioService, emailService);
const observerController = new ObserverController(observerService);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'));
    }
  },
});

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

/**
 * @route   POST /api/v1/observers/mobile/register
 * @desc    Register new field observer
 * @access  Public
 * @rateLimit 5 requests per 15 minutes per IP
 */
router.post(
  '/register',
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many registration attempts. Please try again later.',
  }),
  observerController.register
);

/**
 * @route   GET /api/v1/observers/mobile/track/:trackingNumber
 * @desc    Track application status
 * @access  Public
 * @rateLimit 10 requests per 5 minutes
 */
router.get(
  '/track/:trackingNumber',
  rateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 10,
  }),
  observerController.trackApplication
);

/**
 * @route   POST /api/v1/observers/mobile/setup-password
 * @desc    Set password for approved observer
 * @access  Public (with token validation)
 * @rateLimit 3 attempts per token
 */
router.post(
  '/setup-password',
  rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
  }),
  observerController.setupPassword
);

/**
 * @route   POST /api/v1/observers/mobile/upload-document
 * @desc    Upload observer documents during or after registration
 * @access  Public (with tracking number validation)
 * @rateLimit 10 uploads per hour
 */
router.post(
  '/upload-document',
  rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
  }),
  upload.single('file'),
  observerController.uploadDocument
);

// ==========================================
// AUTHENTICATED ROUTES (Observer self-service)
// ==========================================

/**
 * @route   GET /api/v1/observers/mobile/profile
 * @desc    Get observer profile (authenticated)
 * @access  Protected - Observer role
 */
router.get(
  '/profile',
  authenticate,
  requireRoles(['field_observer']),
  observerController.getProfile
);

/**
 * @route   PUT /api/v1/observers/mobile/profile
 * @desc    Update observer profile (authenticated)
 * @access  Protected - Observer role
 */
router.put(
  '/profile',
  authenticate,
  requireRoles(['field_observer']),
  observerController.updateProfile
);

/**
 * @route   GET /api/v1/observers/mobile/assignments
 * @desc    Get observer assignments (authenticated)
 * @access  Protected - Observer role
 */
router.get(
  '/assignments',
  authenticate,
  requireRoles(['field_observer']),
  observerController.getAssignments
);

/**
 * @route   GET /api/v1/observers/mobile/status
 * @desc    Get observer status and registration info (authenticated)
 * @access  Protected - Observer role
 */
router.get(
  '/status',
  authenticate,
  requireRoles(['field_observer']),
  observerController.getStatus
);

export default router;
