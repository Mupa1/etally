/**
 * Observer Assignments Admin Routes
 * HTTP routes for managing observer assignments to polling stations
 * All routes protected - requires super_admin or election_manager role
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRoles } from '@/domains/auth/auth.middleware';
import { ObserverAssignmentsController } from './observer-assignments.controller';
import { ObserverAssignmentsService } from './observer-assignments.service';

const router = Router();
const prisma = new PrismaClient();
const observerAssignmentsService = new ObserverAssignmentsService(prisma);
const observerAssignmentsController = new ObserverAssignmentsController(
  observerAssignmentsService
);

// ==========================================
// ASSIGNMENT MANAGEMENT ROUTES
// ==========================================

/**
 * @route   GET /api/v1/admin/observer-assignments/stats
 * @desc    Get assignment statistics for active contests
 * @access  Protected - Super Admin or Election Manager
 */
router.get(
  '/stats',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  observerAssignmentsController.getStatistics
);

/**
 * @route   GET /api/v1/admin/observer-assignments/multiple-contests
 * @desc    Get agents assigned to multiple active contests
 * @access  Protected - Super Admin or Election Manager
 */
router.get(
  '/multiple-contests',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  observerAssignmentsController.getAgentsWithMultipleContests
);

/**
 * @route   GET /api/v1/admin/observer-assignments
 * @desc    Get all observer assignments with filtering
 * @access  Protected - Super Admin or Election Manager
 */
router.get(
  '/',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  observerAssignmentsController.getAssignments
);

/**
 * @route   GET /api/v1/admin/observer-assignments/:id
 * @desc    Get assignment by ID
 * @access  Protected - Super Admin or Election Manager
 */
router.get(
  '/:id',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  observerAssignmentsController.getAssignmentById
);

/**
 * @route   POST /api/v1/admin/observer-assignments
 * @desc    Create new assignment
 * @access  Protected - Super Admin or Election Manager
 */
router.post(
  '/',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  observerAssignmentsController.createAssignment
);

/**
 * @route   PUT /api/v1/admin/observer-assignments/:id
 * @desc    Update assignment
 * @access  Protected - Super Admin or Election Manager
 */
router.put(
  '/:id',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  observerAssignmentsController.updateAssignment
);

/**
 * @route   DELETE /api/v1/admin/observer-assignments/:id
 * @desc    Delete assignment
 * @access  Protected - Super Admin or Election Manager
 */
router.delete(
  '/:id',
  authenticate,
  requireRoles(['super_admin', 'election_manager']),
  observerAssignmentsController.deleteAssignment
);

export default router;

