/**
 * Authentication Routes
 * Defines HTTP routes for authentication endpoints
 *
 * NOTE: Uses hybrid RBAC + ABAC approach
 * - RBAC: Basic role checking (existing)
 * - ABAC: Fine-grained access control (new)
 */

import { Router } from 'express';
import AuthController from './auth.controller';
import { authenticate } from './auth.middleware';
import { requirePermission } from '@/infrastructure/middleware/authorization.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (Admin only)
 * @access  Protected - Admin/Election Manager only
 * @abac    Requires 'create' permission on 'user' resource
 */
router.post(
  '/register',
  authenticate,
  requirePermission('user', 'create'),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Protected
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   PUT /api/v1/auth/first-login-password-change
 * @desc    Change password on first login for initial super admin
 * @access  Protected
 */
router.put(
  '/first-login-password-change',
  authenticate,
  authController.firstLoginPasswordChange
);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Protected
 */
router.put('/change-password', authenticate, authController.changePassword);

export default router;
