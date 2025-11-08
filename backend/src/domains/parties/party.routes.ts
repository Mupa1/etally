/**
 * Political Party Routes
 * RESTful API endpoints for party management
 */

import { Router } from 'express';
import multer from 'multer';
import PartyController from './party.controller';
import authMiddleware from '@/domains/auth/auth.middleware';

const router = Router();
const partyController = new PartyController();

// Configure multer for CSV upload (memory storage)
const uploadCSV = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Configure multer for image upload (memory storage)
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

// Apply authentication middleware to all party routes
router.use(authMiddleware.authenticate);

// ==========================================
// PARTY MANAGEMENT ROUTES
// ==========================================

/**
 * @route   GET /api/v1/parties/statistics/summary
 * @desc    Get party statistics
 * @access  Private (Admin, Election Manager)
 */
router.get(
  '/statistics/summary',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  partyController.getStatistics
);

/**
 * @route   POST /api/v1/parties/upload
 * @desc    Upload parties from CSV file
 * @access  Private (Admin, Election Manager)
 */
router.post(
  '/upload',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  uploadCSV.single('file'),
  partyController.uploadPartiesCSV
);

/**
 * @route   GET /api/v1/parties/download
 * @desc    Download all parties as CSV file
 * @access  Private (Admin, Election Manager)
 */
router.get(
  '/download',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  partyController.downloadPartiesCSV
);

/**
 * @route   GET /api/v1/parties
 * @desc    Get all parties with optional filters
 * @access  Private (All authenticated users)
 */
router.get('/', partyController.getParties);

/**
 * @route   POST /api/v1/parties
 * @desc    Create a new party
 * @access  Private (Admin, Election Manager)
 */
router.post(
  '/',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  partyController.createParty
);

/**
 * @route   POST /api/v1/parties/:id/logo
 * @desc    Upload party logo
 * @access  Private (Admin, Election Manager)
 */
router.post(
  '/:id/logo',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  uploadImage.single('logo'),
  partyController.uploadLogo
);

/**
 * @route   GET /api/v1/parties/:id/logo
 * @desc    Get party logo presigned URL
 * @access  Private (All authenticated users)
 */
router.get('/:id/logo', partyController.getLogoUrl);

/**
 * @route   GET /api/v1/parties/:id
 * @desc    Get party by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', partyController.getParty);

/**
 * @route   PUT /api/v1/parties/:id
 * @desc    Update party
 * @access  Private (Admin, Election Manager)
 */
router.put(
  '/:id',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  partyController.updateParty
);

/**
 * @route   DELETE /api/v1/parties/:id
 * @desc    Delete party
 * @access  Private (Admin, Election Manager)
 */
router.delete(
  '/:id',
  authMiddleware.requireRoles(['super_admin', 'election_manager']),
  partyController.deleteParty
);

export default router;
