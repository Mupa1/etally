/**
 * Geographic Routes
 * HTTP routes for geographic data management
 */

import { Router } from 'express';
import {
  authenticate,
  requireSuperAdmin,
} from '@/domains/auth/auth.middleware';
import GeographicController from './geographic.controller';

const router = Router();
const geographicController = new GeographicController();

/**
 * @route   POST /api/v1/geographic/bulk-upload
 * @desc    Bulk upload geographic data (counties, constituencies, wards, polling stations)
 * @access  Protected - Super Admin only
 * @body    { data: INormalizedCSVRow[], chunkIndex: number, totalChunks: number }
 */
router.post(
  '/bulk-upload',
  authenticate,
  requireSuperAdmin,
  geographicController.bulkUpload
);

/**
 * @route   GET /api/v1/geographic/stats
 * @desc    Get basic geographic statistics (legacy)
 * @access  Protected
 */
router.get('/stats', authenticate, geographicController.getStatistics);

/**
 * @route   GET /api/v1/geographic/voting-stats
 * @desc    Get comprehensive voting area statistics with voter counts and hierarchical breakdown
 * @access  Protected
 * @query   ?countyId=xxx&constituencyId=yyy&wardId=zzz&isActive=true
 */
router.get(
  '/voting-stats',
  authenticate,
  geographicController.getVotingAreaStatistics
);

/**
 * @route   GET /api/v1/geographic/hierarchy
 * @desc    Get hierarchical data with drill-down support (counties → constituencies → wards → polling stations)
 * @access  Protected
 * @query   ?level=county&countyId=xxx&constituencyId=yyy&wardId=zzz&search=xxx&isActive=true&page=1&limit=100
 */
router.get('/hierarchy', authenticate, geographicController.getHierarchyData);

/**
 * @route   GET /api/v1/geographic/search
 * @desc    Search and filter polling stations with full hierarchy information
 * @access  Protected
 * @query   ?search=xxx&countyId=yyy&constituencyId=zzz&wardId=www&isActive=true&page=1&limit=20&sortBy=name&sortOrder=asc
 */
router.get('/search', authenticate, geographicController.searchPollingStations);

/**
 * @route   GET /api/v1/geographic/counties
 * @desc    Get all counties with nested constituencies, wards, and polling stations
 * @access  Protected
 * @query   ?isActive=true&countyId=xxx
 */
router.get('/counties', authenticate, geographicController.getCounties);

/**
 * @route   GET /api/v1/geographic/constituencies
 * @desc    Get all constituencies with nested wards and polling stations
 * @access  Protected
 * @query   ?countyId=xxx&isActive=true
 */
router.get(
  '/constituencies',
  authenticate,
  geographicController.getConstituencies
);

/**
 * @route   GET /api/v1/geographic/wards
 * @desc    Get all wards with nested polling stations
 * @access  Protected
 * @query   ?constituencyId=xxx&isActive=true
 */
router.get('/wards', authenticate, geographicController.getWards);

/**
 * @route   GET /api/v1/geographic/polling-stations
 * @desc    Get all polling stations with hierarchy information
 * @access  Protected
 * @query   ?wardId=xxx&isActive=true
 */
router.get(
  '/polling-stations',
  authenticate,
  geographicController.getPollingStations
);

/**
 * @route   DELETE /api/v1/geographic/delete-all
 * @desc    Delete all voting areas data (counties, constituencies, wards, polling stations)
 * @access  Protected - Super Admin only
 * @warning This action is irreversible and will delete ALL geographic data
 */
router.delete(
  '/delete-all',
  authenticate,
  requireSuperAdmin,
  geographicController.deleteAllVotingAreas
);

export default router;
