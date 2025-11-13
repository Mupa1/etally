/**
 * Mobile Domain Module
 * Field Observer Registration and PWA Support
 */

import { PrismaClient } from '@prisma/client';
import { ObserverService } from './observer.service';
import { ObserverController } from './observer.controller';
import { createObserverRoutes } from './observer.routes';
import { ObserverAdminService } from './observer-admin.service';
import { ObserverAdminController } from './observer-admin.controller';
import observerAdminRoutes from './observer-admin.routes';
import observerMobileRoutes from './observer-mobile.routes';
import observerApplicationsRoutes from './observer-applications.routes';
import { ObserverMinIOService } from './minio.service';
import { SmsService } from './sms.service';

// Initialize services
const prisma = new PrismaClient();
const smsService = new SmsService();
const minioService = new ObserverMinIOService();

// Create observer services
const observerService = new ObserverService(prisma, minioService, smsService);
const observerAdminService = new ObserverAdminService(
  prisma,
  minioService,
  smsService
);

// Create controllers
const observerController = new ObserverController(observerService);
const observerAdminController = new ObserverAdminController(
  observerAdminService
);

// Create routes
const observerRoutes = createObserverRoutes(observerService);

// Export for server integration
export {
  observerRoutes,
  observerAdminRoutes,
  observerMobileRoutes,
  observerApplicationsRoutes,
  observerService,
  observerAdminService,
  observerController,
  observerAdminController,
};

// Export types and services for testing
export {
  ObserverService,
  ObserverController,
  ObserverAdminService,
  ObserverAdminController,
  SmsService,
  ObserverMinIOService,
};
export * from './observer.types';
export * from './observer.validator';
