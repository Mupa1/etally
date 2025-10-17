/**
 * Mobile Domain Module
 * Field Observer Registration and PWA Support
 */

import { PrismaClient } from '@prisma/client';
import { ObserverService } from './observer.service';
import { ObserverController } from './observer.controller';
import { createObserverRoutes } from './observer.routes';
import { EmailService } from './email.service';
import { ObserverMinIOService } from './minio.service';

// Initialize services
const prisma = new PrismaClient();
const emailService = new EmailService();
const minioService = new ObserverMinIOService();

// Create observer service
const observerService = new ObserverService(prisma, minioService, emailService);

// Create routes
const observerRoutes = createObserverRoutes(observerService);

// Export for server integration
export { observerRoutes, observerService };

// Export types and services for testing
export {
  ObserverService,
  ObserverController,
  EmailService,
  ObserverMinIOService,
};
export * from './observer.types';
export * from './observer.validator';
