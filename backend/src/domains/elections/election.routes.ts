/**
 * Election Routes
 * HTTP routes for election management with ABAC protection
 */

import { Router } from 'express';
import { authenticate } from '@/domains/auth/auth.middleware';
import { requirePermission } from '@/infrastructure/middleware/authorization.middleware';
import ElectionController from './election.controller';

const router = Router();
const electionController = new ElectionController();

/**
 * @route   GET /api/v1/elections/stats
 * @desc    Get election statistics
 * @access  Protected
 * @abac    Filtered by user's geographic scope
 */
router.get('/stats', authenticate, electionController.getStats);

/**
 * @route   POST /api/v1/elections
 * @desc    Create a new election
 * @access  Protected - Requires 'create' permission on 'election'
 * @abac    Checks: Role (manager+), Geographic scope
 */
router.post(
  '/',
  authenticate,
  requirePermission('election', 'create'),
  electionController.create
);

/**
 * @route   GET /api/v1/elections
 * @desc    List all elections
 * @access  Protected
 * @abac    Results filtered by user's geographic scope
 */
router.get(
  '/',
  authenticate,
  requirePermission('election', 'read'),
  electionController.list
);

/**
 * @route   GET /api/v1/elections/:id
 * @desc    Get election details
 * @access  Protected
 * @abac    Checks: Role, Geographic scope
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('election', 'read'),
  electionController.getById
);

/**
 * @route   PUT /api/v1/elections/:id
 * @desc    Update an election
 * @access  Protected - Requires 'update' permission
 * @abac    Checks: Role, Ownership, Status
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('election', 'update'),
  electionController.update
);

/**
 * @route   DELETE /api/v1/elections/:id
 * @desc    Delete an election
 * @access  Protected - Requires 'delete' permission
 * @abac    Checks: Role, Ownership (creator or super_admin)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('election', 'delete'),
  electionController.delete
);

/**
 * @route   POST /api/v1/elections/:id/approve
 * @desc    Approve an election
 * @access  Protected - Requires 'approve' permission
 * @abac    Checks: Role (managers only)
 */
router.post(
  '/:id/approve',
  authenticate,
  requirePermission('election', 'approve'),
  electionController.approve
);

export default router;

