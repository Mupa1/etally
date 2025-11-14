/**
 * SMS Template Routes
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRoles } from '@/domains/auth/auth.middleware';
import { SmsTemplateService } from './sms-template.service';
import { SmsTemplateController } from './sms-template.controller';

const router = Router();

const prisma = new PrismaClient();
const smsTemplateService = new SmsTemplateService(prisma);
const smsTemplateController = new SmsTemplateController(smsTemplateService);

router.get('/', smsTemplateController.getTemplates);
router.get('/:id', smsTemplateController.getTemplateById);
router.get('/type/:type', smsTemplateController.getTemplateByType);

router.post(
  '/',
  authenticate,
  requireRoles(['super_admin']),
  smsTemplateController.createTemplate
);

router.put(
  '/:id',
  authenticate,
  requireRoles(['super_admin']),
  smsTemplateController.updateTemplate
);

router.delete(
  '/:id',
  authenticate,
  requireRoles(['super_admin']),
  smsTemplateController.deleteTemplate
);

router.post(
  '/render',
  authenticate,
  requireRoles(['super_admin']),
  smsTemplateController.renderTemplate
);

export default router;

