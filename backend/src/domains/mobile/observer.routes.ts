/**
 * Observer Registration Routes
 * Defines all HTTP routes for observer registration and management
 */

import { Router } from 'express';
import multer from 'multer';
import { ObserverController } from './observer.controller';
import { ObserverService } from './observer.service';
import { MobileGeographicService } from './geographic.service';
import { authenticate, requireRoles } from '@/domains/auth/auth.middleware';
import { rateLimiter } from '@/infrastructure/middleware/rate-limit.middleware';

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'));
    }
  },
});

export function createObserverRoutes(observerService: ObserverService): Router {
  const router = Router();
  const controller = new ObserverController(observerService);
  const geoService = new MobileGeographicService();

  // ==========================================
  // PUBLIC ROUTES (No authentication required)
  // ==========================================

  /**
   * POST /api/mobile/register
   * Register new field observer
   * Rate limit: 5 requests per 15 minutes per IP
   */
  router.post(
    '/register',
    rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
      message: 'Too many registration attempts. Please try again later.',
    }),
    controller.register
  );

  /**
   * GET /api/mobile/track/:trackingNumber
   * Track application status
   * Rate limit: 10 requests per 5 minutes
   */
  router.get(
    '/track/:trackingNumber',
    rateLimiter({
      windowMs: 5 * 60 * 1000,
      max: 10,
    }),
    controller.trackApplication
  );

  /**
   * POST /api/mobile/setup-password
   * Set password for approved observer
   * Rate limit: 3 attempts per token
   */
  router.post(
    '/setup-password',
    rateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
    }),
    controller.setupPassword
  );

  /**
   * POST /api/mobile/register/:trackingNumber/upload-document
   * Upload observer documents during or after registration
   * Rate limit: 10 uploads per hour
   */
  router.post(
    '/register/:trackingNumber/upload-document',
    rateLimiter({
      windowMs: 60 * 60 * 1000,
      max: 10,
    }),
    upload.single('file'),
    controller.uploadDocument
  );

  // ==========================================
  // ADMIN ROUTES (Authentication + Role required)
  // ==========================================

  /**
   * GET /api/admin/observers/applications
   * List all observer applications
   * Requires: super_admin OR election_manager
   */
  router.get(
    '/admin/applications',
    authenticate,
    requireRoles(['super_admin', 'election_manager']),
    controller.getApplications
  );

  /**
   * GET /api/admin/observers/applications/:id
   * Get application detail
   * Requires: super_admin OR election_manager
   */
  router.get(
    '/admin/applications/:id',
    authenticate,
    requireRoles(['super_admin', 'election_manager']),
    controller.getApplicationDetail
  );

  /**
   * POST /api/admin/observers/applications/:id/review
   * Review and approve/reject application
   * Requires: super_admin OR election_manager
   */
  router.post(
    '/admin/applications/:id/review',
    authenticate,
    requireRoles(['super_admin', 'election_manager']),
    controller.reviewApplication
  );

  /**
   * POST /api/admin/observers/bulk-approve
   * Bulk approve multiple applications
   * Requires: super_admin OR election_manager
   */
  router.post(
    '/admin/bulk-approve',
    authenticate,
    requireRoles(['super_admin', 'election_manager']),
    controller.bulkApprove
  );

  /**
   * GET /api/admin/observers/statistics
   * Get observer statistics
   * Requires: super_admin OR election_manager
   */
  router.get(
    '/admin/statistics',
    authenticate,
    requireRoles(['super_admin', 'election_manager']),
    controller.getStatistics
  );

  // ==========================================
  // GEOGRAPHIC DATA ROUTES (Public for registration form)
  // ==========================================

  /**
   * PUBLIC GEOGRAPHIC ENDPOINTS
   * These endpoints are used during registration (no auth required)
   * Rate limited to prevent abuse: 30 requests per 15 minutes
   */

  // Rate limiter for public geographic endpoints
  const geoRateLimit = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per window
    message:
      'Too many requests to geographic endpoints. Please try again later.',
  });

  /**
   * GET /api/mobile/geographic/counties
   * Get all counties for dropdown selection
   * Public endpoint for registration form
   */
  router.get('/geographic/counties', geoRateLimit, async (_req, res, next) => {
    try {
      const counties = await geoService.getCounties();
      return res.status(200).json({ success: true, data: counties });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /api/mobile/geographic/constituencies
   * Get constituencies for selected county
   * Query: ?countyId=xxx
   * Public endpoint for registration form
   */
  router.get(
    '/geographic/constituencies',
    geoRateLimit,
    async (req, res, next) => {
      try {
        const { countyId } = req.query;

        if (!countyId || typeof countyId !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'countyId is required',
          });
        }

        const constituencies = await geoService.getConstituencies(countyId);
        return res.status(200).json({ success: true, data: constituencies });
      } catch (error) {
        return next(error);
      }
    }
  );

  /**
   * GET /api/mobile/geographic/wards
   * Get wards for selected constituency
   * Query: ?constituencyId=xxx
   * Public endpoint for registration form
   */
  router.get('/geographic/wards', geoRateLimit, async (req, res, next) => {
    try {
      const { constituencyId } = req.query;

      if (!constituencyId || typeof constituencyId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'constituencyId is required',
        });
      }

      const wards = await geoService.getWards(constituencyId);
      return res.status(200).json({ success: true, data: wards });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /api/mobile/geographic/polling-stations
   * Get polling stations for selected ward
   * Query: ?wardId=xxx
   * Public endpoint for registration form
   */
  router.get(
    '/geographic/polling-stations',
    geoRateLimit,
    async (req, res, next) => {
      try {
        const { wardId } = req.query;

        if (!wardId || typeof wardId !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'wardId is required',
          });
        }

        const stations = await geoService.getPollingStations(wardId);
        return res.status(200).json({ success: true, data: stations });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
