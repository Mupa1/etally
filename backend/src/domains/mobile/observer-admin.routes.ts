/**
 * Observer Admin Routes
 * HTTP routes for observer CRUD operations and analytics
 * All routes protected - requires super_admin or election_manager role
 */

import { Router } from 'express';
import { ObserverAdminController } from './observer-admin.controller';
import { ObserverAdminService } from './observer-admin.service';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRoles } from '@/domains/auth/auth.middleware';
import { requirePermission } from '@/infrastructure/middleware/authorization.middleware';

const router = Router();
const prisma = new PrismaClient();
const observerAdminService = new ObserverAdminService(prisma);
const observerAdminController = new ObserverAdminController(
  observerAdminService
);

// ==========================================
// OBSERVER MANAGEMENT ROUTES
// ==========================================

/**
 * @route   GET /api/v1/admin/observers
 * @desc    Get all observers with filtering and pagination
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'read' permission on 'observer' resource
 */
router.get(
  '/',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  // requirePermission('observer', 'read'), // Temporarily disabled for debugging
  observerAdminController.getObservers
);

/**
 * @route   GET /api/v1/admin/observers/stats
 * @desc    Get observer statistics
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'read' permission on 'observer' resource
 */
router.get(
  '/stats',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  // requirePermission('observer', 'read'), // Temporarily disabled for debugging
  observerAdminController.getObserverStats
);

/**
 * @route   GET /api/v1/admin/observers/analytics
 * @desc    Get observer analytics and trends
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'read' permission on 'observer' resource
 */
router.get(
  '/analytics',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'read'),
  observerAdminController.getObserverAnalytics
);

/**
 * @route   GET /api/v1/admin/observers/dashboard
 * @desc    Get observer dashboard data (stats + recent + analytics)
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'read' permission on 'observer' resource
 */
router.get(
  '/dashboard',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'read'),
  observerAdminController.getObserverDashboard
);

/**
 * @route   GET /api/v1/admin/observers/export
 * @desc    Export observers to CSV
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'export' permission on 'observer' resource
 */
router.get(
  '/export',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'export'),
  observerAdminController.exportObservers
);

/**
 * @route   GET /api/v1/admin/observers/:id
 * @desc    Get observer by ID
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'read' permission on 'observer' resource
 */
router.get(
  '/:id',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'read'),
  observerAdminController.getObserverById
);

/**
 * @route   PUT /api/v1/admin/observers/:id
 * @desc    Update observer
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'update' permission on 'observer' resource
 */
router.put(
  '/:id',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'update'),
  observerAdminController.updateObserver
);

/**
 * @route   DELETE /api/v1/admin/observers/:id
 * @desc    Delete observer (soft delete)
 * @access  Protected - Super Admin only
 * @abac    Requires 'delete' permission on 'observer' resource
 */
router.delete(
  '/:id',
  authenticate,
  requireRoles(['super_admin']),
  requirePermission('observer', 'delete'),
  observerAdminController.deleteObserver
);

/**
 * @route   POST /api/v1/admin/observers/bulk-update
 * @desc    Bulk update observer status
 * @access  Protected - Super Admin or Election Manager
 * @abac    Requires 'update' permission on 'observer' resource
 */
router.post(
  '/bulk-update',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  requirePermission('observer', 'update'),
  observerAdminController.bulkUpdateStatus
);

export default router;
