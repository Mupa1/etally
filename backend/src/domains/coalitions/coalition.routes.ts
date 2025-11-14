/**
 * Coalition Routes
 * RESTful API endpoints for coalition management
 */

import { Router } from 'express';
import CoalitionController from './coalition.controller';
import authMiddleware from '@/domains/auth/auth.middleware';

const router = Router();
const coalitionController = new CoalitionController();

// Apply authentication middleware to all coalition routes
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/v1/coalitions/statistics
 * @desc    Get coalition statistics
 * @access  Private (Admin, Election Manager)
 */
router.get(
  '/statistics',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  coalitionController.getStatistics
);

/**
 * @route   GET /api/v1/coalitions
 * @desc    Get all coalitions with optional filters
 * @access  Private (All authenticated users)
 */
router.get('/', coalitionController.getCoalitions);

/**
 * @route   POST /api/v1/coalitions
 * @desc    Create a new coalition
 * @access  Private (Admin, Election Manager)
 */
router.post(
  '/',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  coalitionController.createCoalition
);

/**
 * @route   GET /api/v1/coalitions/:id
 * @desc    Get coalition by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', coalitionController.getCoalition);

/**
 * @route   PUT /api/v1/coalitions/:id
 * @desc    Update coalition
 * @access  Private (Admin, Election Manager)
 */
router.put(
  '/:id',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  coalitionController.updateCoalition
);

/**
 * @route   DELETE /api/v1/coalitions/:id
 * @desc    Delete coalition
 * @access  Private (Admin, Election Manager)
 */
router.delete(
  '/:id',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  coalitionController.deleteCoalition
);

/**
 * @route   POST /api/v1/coalitions/:id/parties
 * @desc    Add parties to coalition
 * @access  Private (Admin, Election Manager)
 */
router.post(
  '/:id/parties',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  coalitionController.addParties
);

/**
 * @route   DELETE /api/v1/coalitions/:id/parties
 * @desc    Remove parties from coalition
 * @access  Private (Admin, Election Manager)
 */
router.delete(
  '/:id/parties',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  coalitionController.removeParties
);

/**
 * @route   POST /api/v1/coalitions/:id/parties/remove
 * @desc    Remove parties from coalition (POST alternative for DELETE with body)
 * @access  Private (Admin, Election Manager)
 */
router.post(
  '/:id/parties/remove',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  coalitionController.removeParties
);

export default router;

