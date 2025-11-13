/**
 * Observer Applications Management Routes
 * HTTP routes for managing observer applications, review, and approval workflow
 * All routes protected - requires super_admin or election_manager role
 */

import { Router } from 'express';
import { ObserverController } from './observer.controller';
import { ObserverService } from './observer.service';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRoles } from '@/domains/auth/auth.middleware';
import { requirePermission } from '@/infrastructure/middleware/authorization.middleware';
import { SmsService } from './sms.service';
import { ObserverMinIOService } from './minio.service';

const router = Router();
const prisma = new PrismaClient();
const smsService = new SmsService();
const minioService = new ObserverMinIOService();
const observerService = new ObserverService(prisma, minioService, smsService);
const observerController = new ObserverController(observerService);

// ==========================================
// APPLICATION MANAGEMENT ROUTES
// ==========================================

/**
 * @route   GET /api/v1/admin/observer-applications
 * @desc    List all observer applications with filtering and pagination
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'read' permission on 'observer' resource
 */
router.get(
  '/',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'read'),
  observerController.getApplications
);

/**
 * @route   GET /api/v1/admin/observer-applications/statistics
 * @desc    Get observer application statistics
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'read' permission on 'observer' resource
 */
router.get(
  '/statistics',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'read'),
  observerController.getStatistics
);

/**
 * @route   GET /api/v1/admin/observer-applications/:id
 * @desc    Get application detail by ID
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'read' permission on 'observer' resource
 */
router.get(
  '/:id',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'read'),
  observerController.getApplicationDetail
);

/**
 * @route   POST /api/v1/admin/observer-applications/:id/review
 * @desc    Review and approve/reject application
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'update' permission on 'observer' resource
 */
router.post(
  '/:id/review',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'update'),
  observerController.reviewApplication
);

/**
 * @route   POST /api/v1/admin/observer-applications/bulk-approve
 * @desc    Bulk approve multiple applications
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'update' permission on 'observer' resource
 */
router.post(
  '/bulk-approve',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'update'),
  observerController.bulkApprove
);

/**
 * @route   POST /api/v1/admin/observer-applications/bulk-reject
 * @desc    Bulk reject multiple applications
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'update' permission on 'observer' resource
 */
router.post(
  '/bulk-reject',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'update'),
  observerController.bulkReject
);

/**
 * @route   GET /api/v1/admin/observer-applications/export
 * @desc    Export applications to CSV
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'export' permission on 'observer' resource
 */
router.get(
  '/export',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'export'),
  observerController.exportApplications
);

/**
 * @route   DELETE /api/v1/admin/observer-applications/:id
 * @desc    Delete application (soft delete)
 * @access  Protected - Super Admin only
 * @abac    Requires 'delete' permission on 'observer' resource
 */
router.delete(
  '/:id',
  authenticate,
  requireRoles(['super_admin']),
  requirePermission('observer', 'delete'),
  observerController.deleteApplication
);

export default router;
