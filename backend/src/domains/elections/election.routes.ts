/**
 * Election Routes
 * HTTP routes for election management with ABAC protection
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '@/domains/auth/auth.middleware';
import { requirePermission } from '@/infrastructure/middleware/authorization.middleware';
import ElectionController from './election.controller';

const router = Router();
const electionController = new ElectionController();

// Configure multer for CSV upload (memory storage)
const uploadCSV = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

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

/**
 * @route   POST /api/v1/elections/:electionId/contests/:contestId/contestants/upload
 * @desc    Upload contestants from CSV file (for existing contest)
 * @access  Protected - Requires 'update' permission
 * @abac    Checks: Role, Ownership, Status
 */
router.post(
  '/:electionId/contests/:contestId/contestants/upload',
  authenticate,
  requirePermission('election', 'update'),
  uploadCSV.single('file'),
  electionController.uploadContestants
);

/**
 * @route   GET /api/v1/elections/contests/template
 * @desc    Download CSV template for contests and candidates
 * @access  Protected - Requires 'read' permission on 'election'
 */
router.get(
  '/contests/template',
  authenticate,
  requirePermission('election', 'read'),
  electionController.downloadContestsTemplate
);

/**
 * @route   POST /api/v1/elections/:electionId/contests/upload
 * @desc    Upload contests and candidates from CSV file (for by-elections)
 * @access  Protected - Requires 'update' permission
 * @abac    Checks: Role, Ownership, Status
 */
router.post(
  '/:electionId/contests/upload',
  authenticate,
  requirePermission('election', 'update'),
  uploadCSV.single('file'),
  electionController.uploadContests
);

export default router;

