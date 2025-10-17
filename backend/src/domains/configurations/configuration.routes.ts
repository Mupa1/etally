/**
 * Configuration Routes
 * RESTful API endpoints for configuration management
 */

import { Router } from 'express';
import ConfigurationController from './configuration.controller';
import authMiddleware from '@/domains/auth/auth.middleware';

const router = Router();
const configurationController = new ConfigurationController();

// Apply authentication middleware to all configuration routes
router.use(authMiddleware.authenticate);

// ==========================================
// CONFIGURATION CRUD ROUTES
// ==========================================

/**
 * @route   GET /api/v1/configurations
 * @desc    Get all configurations with optional filters
 * @access  Private (Super Admin)
 */
router.get(
  '/',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.getConfigurations
);

/**
 * @route   POST /api/v1/configurations
 * @desc    Create a new configuration
 * @access  Private (Super Admin)
 */
router.post(
  '/',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.createConfiguration
);

/**
 * @route   POST /api/v1/configurations/bulk
 * @desc    Bulk create configurations
 * @access  Private (Super Admin)
 */
router.post(
  '/bulk',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.bulkCreateConfigurations
);

/**
 * @route   GET /api/v1/configurations/categories/list
 * @desc    Get all configuration categories with counts
 * @access  Private (Super Admin)
 */
router.get(
  '/categories/list',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.getCategories
);

/**
 * @route   GET /api/v1/configurations/category/:category
 * @desc    Get configurations by category
 * @access  Private (Super Admin)
 */
router.get(
  '/category/:category',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.getConfigurationsByCategory
);

/**
 * @route   GET /api/v1/configurations/key/:key
 * @desc    Get configuration by key
 * @access  Private (Super Admin)
 */
router.get(
  '/key/:key',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.getConfigurationByKey
);

/**
 * @route   PATCH /api/v1/configurations/key/:key
 * @desc    Update configuration value by key
 * @access  Private (Super Admin)
 */
router.patch(
  '/key/:key',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.updateConfigurationValue
);

/**
 * @route   GET /api/v1/configurations/:id
 * @desc    Get configuration by ID
 * @access  Private (Super Admin)
 */
router.get(
  '/:id',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.getConfiguration
);

/**
 * @route   PUT /api/v1/configurations/:id
 * @desc    Update configuration
 * @access  Private (Super Admin)
 */
router.put(
  '/:id',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.updateConfiguration
);

/**
 * @route   DELETE /api/v1/configurations/:id
 * @desc    Delete configuration
 * @access  Private (Super Admin)
 */
router.delete(
  '/:id',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.deleteConfiguration
);

/**
 * @route   POST /api/v1/configurations/:id/reset
 * @desc    Reset configuration to default value
 * @access  Private (Super Admin)
 */
router.post(
  '/:id/reset',
  authMiddleware.requireRoles(['super_admin']),
  configurationController.resetToDefault
);

export default router;
