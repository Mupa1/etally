/**
 * Observer Admin Controller
 * HTTP handlers for observer CRUD operations and analytics
 */

import { Request, Response, NextFunction } from 'express';
import {
  ObserverAdminService,
  ObserverFilters,
  ObserverUpdateData,
} from './observer-admin.service';
import { ValidationError } from '@/shared/types/errors';
import { z } from 'zod';

// Validation schemas
const observerFiltersSchema = z.object({
  status: z
    .enum([
      'pending_review',
      'approved',
      'active',
      'rejected',
      'suspended',
      'inactive',
    ])
    .optional(),
  location: z.string().optional(),
  registrationStatus: z
    .enum([
      'pending_review',
      'approved',
      'active',
      'rejected',
      'suspended',
      'inactive',
    ])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z
    .enum(['name', 'email', 'status', 'submissionDate', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const observerUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  status: z
    .enum([
      'pending_review',
      'approved',
      'active',
      'rejected',
      'suspended',
      'inactive',
    ])
    .optional(),
  location: z.string().optional(),
  reviewNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

const bulkUpdateSchema = z.object({
  observerIds: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum([
    'pending_review',
    'approved',
    'active',
    'rejected',
    'suspended',
    'inactive',
  ]),
  notes: z.string().max(1000).optional(),
});

const analyticsQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

export class ObserverAdminController {
  constructor(private observerAdminService: ObserverAdminService) {}

  /**
   * Get all observers with filtering and pagination
   * GET /api/v1/admin/observers
   */
  getObservers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = observerFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError('Invalid filter parameters');
      }

      const filters: ObserverFilters = validationResult.data;
      const result = await this.observerAdminService.getObservers(filters);

      res.status(200).json({
        success: true,
        message: 'Observers retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get observer by ID
   * GET /api/v1/admin/observers/:id
   */
  getObserverById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Observer ID is required');
      }

      const observer = await this.observerAdminService.getObserverById(id);

      res.status(200).json({
        success: true,
        message: 'Observer retrieved successfully',
        data: observer,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update observer
   * PUT /api/v1/admin/observers/:id
   */
  updateObserver = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const reviewerId = (req as any).user?.id;

      if (!id) {
        throw new ValidationError('Observer ID is required');
      }

      if (!reviewerId) {
        throw new ValidationError('Reviewer ID is required');
      }

      const validationResult = observerUpdateSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const updateData: ObserverUpdateData = validationResult.data;
      const updatedObserver = await this.observerAdminService.updateObserver(
        id,
        updateData,
        reviewerId
      );

      res.status(200).json({
        success: true,
        message: 'Observer updated successfully',
        data: updatedObserver,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete observer (soft delete)
   * DELETE /api/v1/admin/observers/:id
   */
  deleteObserver = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const reviewerId = (req as any).user?.id;

      if (!id) {
        throw new ValidationError('Observer ID is required');
      }

      if (!reviewerId) {
        throw new ValidationError('Reviewer ID is required');
      }

      const deletedObserver = await this.observerAdminService.deleteObserver(
        id,
        reviewerId
      );

      res.status(200).json({
        success: true,
        message: 'Observer deactivated successfully',
        data: deletedObserver,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update observer status
   * POST /api/v1/admin/observers/bulk-update
   */
  bulkUpdateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reviewerId = (req as any).user?.id;

      if (!reviewerId) {
        throw new ValidationError('Reviewer ID is required');
      }

      const validationResult = bulkUpdateSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const { observerIds, status, notes } = validationResult.data;
      const result = await this.observerAdminService.bulkUpdateStatus(
        observerIds,
        status,
        reviewerId,
        notes
      );

      res.status(200).json({
        success: true,
        message: `Successfully updated ${result.count} observers`,
        data: { updatedCount: result.count },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get observer statistics
   * GET /api/v1/admin/observers/stats
   */
  getObserverStats = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.observerAdminService.getObserverStats();

      res.status(200).json({
        success: true,
        message: 'Observer statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get observer analytics
   * GET /api/v1/admin/observers/analytics
   */
  getObserverAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = analyticsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters');
      }

      const { days } = validationResult.data;
      const analytics =
        await this.observerAdminService.getObserverAnalytics(days);

      res.status(200).json({
        success: true,
        message: 'Observer analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export observers to CSV
   * GET /api/v1/admin/observers/export
   */
  exportObservers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = observerFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError('Invalid filter parameters');
      }

      const filters: ObserverFilters = validationResult.data;
      const csvData = await this.observerAdminService.exportObservers(filters);

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="observers.csv"'
      );

      // Convert to CSV
      if (csvData.length === 0) {
        res.status(200).send('No data to export');
        return;
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              // Escape commas and quotes in CSV
              return typeof value === 'string' &&
                (value.includes(',') || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            })
            .join(',')
        ),
      ].join('\n');

      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get observer dashboard data
   * GET /api/v1/admin/observers/dashboard
   */
  getObserverDashboard = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const [stats, recentObservers, analytics] = await Promise.all([
        this.observerAdminService.getObserverStats(),
        this.observerAdminService.getObservers({
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        this.observerAdminService.getObserverAnalytics(7), // Last 7 days
      ]);

      res.status(200).json({
        success: true,
        message: 'Observer dashboard data retrieved successfully',
        data: {
          stats,
          recentObservers: recentObservers.data,
          analytics: {
            registrationTrends: analytics.registrationTrends,
            statusDistribution: analytics.statusDistribution,
            activityMetrics: analytics.activityMetrics,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
