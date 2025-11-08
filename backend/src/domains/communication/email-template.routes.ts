/**
 * Email Template Routes
 * API endpoints for managing email templates
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateController } from './email-template.controller';
import { authenticate, requireRoles } from '@/domains/auth/auth.middleware';

const router = Router();

// Initialize service and controller
const prisma = new PrismaClient();
const emailTemplateService = new EmailTemplateService(prisma);
const emailTemplateController = new EmailTemplateController(
  emailTemplateService
);

/**
 * GET /api/v1/communication/templates
 * Get all email templates
 */
router.get('/', emailTemplateController.getTemplates);

/**
 * GET /api/v1/communication/templates/:id
 * Get template by ID
 */
router.get('/:id', emailTemplateController.getTemplateById);

/**
 * GET /api/v1/communication/templates/type/:type
 * Get template by type
 */
router.get('/type/:type', emailTemplateController.getTemplateByType);

/**
 * POST /api/v1/communication/templates
 * Create new template
 * Requires: super_admin
 */
router.post(
  '/',
  authenticate,
  requireRoles(['super_admin']),
  emailTemplateController.createTemplate
);

/**
 * PUT /api/v1/communication/templates/:id
 * Update template
 * Requires: super_admin
 */
router.put(
  '/:id',
  authenticate,
  requireRoles(['super_admin']),
  emailTemplateController.updateTemplate
);

/**
 * DELETE /api/v1/communication/templates/:id
 * Delete template
 * Requires: super_admin
 */
router.delete(
  '/:id',
  authenticate,
  requireRoles(['super_admin']),
  emailTemplateController.deleteTemplate
);

/**
 * POST /api/v1/communication/templates/render
 * Render template with variables (preview)
 * Requires: super_admin
 */
router.post(
  '/render',
  authenticate,
  requireRoles(['super_admin']),
  emailTemplateController.renderTemplate
);

export default router;
