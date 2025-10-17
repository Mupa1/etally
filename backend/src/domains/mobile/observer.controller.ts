/**
 * Observer Registration Controller
 * HTTP Request handlers for observer registration and management
 */

import { Request, Response, NextFunction } from 'express';
import { ObserverService } from './observer.service';
import {
  ObserverRegistrationSchema,
  TrackingNumberSchema,
  PasswordSetupSchema,
  ReviewApplicationSchema,
  validateImageFile,
} from './observer.validator';
import { ZodError } from 'zod';

export class ObserverController {
  constructor(private observerService: ObserverService) {}

  /**
   * POST /api/mobile/register
   * Public registration endpoint
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate input
      const validatedData = ObserverRegistrationSchema.parse(req.body);

      // Register observer
      const result = await this.observerService.registerObserver(validatedData);

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };

  /**
   * GET /api/mobile/track/:trackingNumber
   * Track application status
   */
  trackApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { trackingNumber } = req.params;

      // Validate tracking number format
      TrackingNumberSchema.parse({ trackingNumber });

      const status =
        await this.observerService.trackApplication(trackingNumber);

      res.status(200).json(status);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid tracking number format',
        });
        return;
      }
      next(error);
    }
  };

  /**
   * POST /api/mobile/setup-password
   * Set password for approved observer
   */
  setupPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate input
      const validatedData = PasswordSetupSchema.parse(req.body);

      const result = await this.observerService.setupPassword(validatedData);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };

  /**
   * POST /api/mobile/register/:trackingNumber/upload-document
   * Upload observer documents
   */
  uploadDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { trackingNumber } = req.params;
      const { documentType } = req.body;

      // Validate file exists
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }

      // Validate file type and size
      const fileValidation = validateImageFile(
        {
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        documentType
      );

      if (!fileValidation.valid) {
        res.status(400).json({
          success: false,
          error: fileValidation.error,
        });
        return;
      }

      // Upload document
      const documentPath = await this.observerService.uploadDocument(
        trackingNumber,
        documentType,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.status(200).json({
        success: true,
        documentPath,
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/observers/applications
   * Get all observer applications (admin only)
   */
  getApplications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { status, search, limit, offset } = req.query;

      const result = await this.observerService.getApplications({
        status: status as any,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/observers/applications/:id
   * Get application detail (admin only)
   */
  getApplicationDetail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const application = await this.observerService.getApplicationDetail(id);

      res.status(200).json(application);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/admin/observers/applications/:id/review
   * Review observer application (admin only)
   */
  reviewApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const reviewData = ReviewApplicationSchema.parse(req.body);
      const reviewerId = req.user!.userId; // From auth middleware

      const result = await this.observerService.reviewApplication(
        id,
        reviewData,
        reviewerId
      );

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };

  /**
   * POST /api/admin/observers/bulk-approve
   * Bulk approve applications (admin only)
   */
  bulkApprove = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationIds } = req.body;
      const reviewerId = req.user!.userId;

      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'applicationIds must be a non-empty array',
        });
        return;
      }

      const result = await this.observerService.bulkApprove(
        applicationIds,
        reviewerId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/observers/statistics
   * Get observer statistics (admin only)
   */
  getStatistics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.observerService.getObserverStatistics();

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  };
}
