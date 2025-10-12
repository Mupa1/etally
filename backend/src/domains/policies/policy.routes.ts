/**
 * Policy Management Routes
 * HTTP routes for ABAC policy, scope, and permission management
 * All routes protected - only super admins can manage policies
 */

import { Router } from 'express';
import {
  authenticate,
  requireSuperAdmin,
} from '@/domains/auth/auth.middleware';
import PolicyController from './policy.controller';

const router = Router();
const policyController = new PolicyController();

// ==========================================
// POLICY MANAGEMENT ROUTES
// ==========================================

/**
 * @route   POST /api/v1/policies
 * @desc    Create a new access policy
 * @access  Protected - Super Admin only
 */
router.post(
  '/',
  authenticate,
  requireSuperAdmin,
  policyController.createPolicy
);

/**
 * @route   GET /api/v1/policies
 * @desc    List all policies
 * @access  Protected - Super Admin only
 * @query   ?isActive=true&resourceType=election&role=field_observer
 */
router.get('/', authenticate, requireSuperAdmin, policyController.listPolicies);

/**
 * @route   GET /api/v1/policies/:id
 * @desc    Get policy by ID
 * @access  Protected - Super Admin only
 */
router.get('/:id', authenticate, requireSuperAdmin, policyController.getPolicy);

/**
 * @route   PUT /api/v1/policies/:id
 * @desc    Update policy
 * @access  Protected - Super Admin only
 */
router.put(
  '/:id',
  authenticate,
  requireSuperAdmin,
  policyController.updatePolicy
);

/**
 * @route   DELETE /api/v1/policies/:id
 * @desc    Delete policy
 * @access  Protected - Super Admin only
 */
router.delete(
  '/:id',
  authenticate,
  requireSuperAdmin,
  policyController.deletePolicy
);

/**
 * @route   PATCH /api/v1/policies/:id/toggle
 * @desc    Enable/disable policy
 * @access  Protected - Super Admin only
 */
router.patch(
  '/:id/toggle',
  authenticate,
  requireSuperAdmin,
  policyController.togglePolicy
);

// ==========================================
// USER SCOPE MANAGEMENT ROUTES
// ==========================================

/**
 * @route   POST /api/v1/users/:userId/scopes
 * @desc    Assign geographic scope to user
 * @access  Protected - Super Admin and Election Managers
 */
router.post(
  '/users/:userId/scopes',
  authenticate,
  requireSuperAdmin,
  policyController.assignScope
);

/**
 * @route   GET /api/v1/users/:userId/scopes
 * @desc    List user's geographic scopes
 * @access  Protected - Admins or self
 */
router.get(
  '/users/:userId/scopes',
  authenticate,
  policyController.getUserScopes
);

/**
 * @route   DELETE /api/v1/scopes/:scopeId
 * @desc    Remove geographic scope
 * @access  Protected - Super Admin only
 */
router.delete(
  '/scopes/:scopeId',
  authenticate,
  requireSuperAdmin,
  policyController.removeScope
);

/**
 * @route   GET /api/v1/scopes/users
 * @desc    Get users by geographic scope
 * @access  Protected - Super Admin and Election Managers
 * @query   ?countyId=xxx&constituencyId=yyy&wardId=zzz
 */
router.get(
  '/scopes/users',
  authenticate,
  requireSuperAdmin,
  policyController.getUsersByScope
);

// ==========================================
// PERMISSION MANAGEMENT ROUTES
// ==========================================

/**
 * @route   POST /api/v1/users/:userId/permissions
 * @desc    Grant permission to user
 * @access  Protected - Super Admin and Election Managers
 */
router.post(
  '/users/:userId/permissions',
  authenticate,
  requireSuperAdmin,
  policyController.grantPermission
);

/**
 * @route   GET /api/v1/users/:userId/permissions
 * @desc    List user's permissions
 * @access  Protected - Admins or self
 * @query   ?includeExpired=true
 */
router.get(
  '/users/:userId/permissions',
  authenticate,
  policyController.getUserPermissions
);

/**
 * @route   DELETE /api/v1/permissions/:permissionId
 * @desc    Revoke permission
 * @access  Protected - Super Admin only
 */
router.delete(
  '/permissions/:permissionId',
  authenticate,
  requireSuperAdmin,
  policyController.revokePermission
);

/**
 * @route   POST /api/v1/permissions/cleanup
 * @desc    Revoke all expired permissions (maintenance)
 * @access  Protected - Super Admin only
 */
router.post(
  '/permissions/cleanup',
  authenticate,
  requireSuperAdmin,
  policyController.cleanupExpiredPermissions
);

// ==========================================
// AUDIT & ANALYTICS ROUTES
// ==========================================

/**
 * @route   GET /api/v1/permissions/audit
 * @desc    Get permission check audit trail
 * @access  Protected - Super Admin and Election Managers
 * @query   ?userId=xxx&resourceType=election&granted=false&startDate=...
 */
router.get(
  '/permissions/audit',
  authenticate,
  requireSuperAdmin,
  policyController.getAuditTrail
);

/**
 * @route   GET /api/v1/users/:userId/permissions/stats
 * @desc    Get user's permission statistics
 * @access  Protected - Admins or self
 * @query   ?days=30
 */
router.get(
  '/users/:userId/permissions/stats',
  authenticate,
  policyController.getUserStats
);

/**
 * @route   GET /api/v1/permissions/stats
 * @desc    Get system-wide permission statistics
 * @access  Protected - Super Admin only
 * @query   ?days=30
 */
router.get(
  '/permissions/stats',
  authenticate,
  requireSuperAdmin,
  policyController.getSystemStats
);

export default router;
