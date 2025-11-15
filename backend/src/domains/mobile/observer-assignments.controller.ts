/**
 * Observer Assignments Controller
 * HTTP handlers for observer assignment management
 */

import { Request, Response, NextFunction } from 'express';
import {
  ObserverAssignmentsService,
  AssignmentFilters,
  CreateAssignmentData,
  UpdateAssignmentData,
} from './observer-assignments.service';
import { ValidationError } from '@/shared/types/errors';
import { z } from 'zod';

// Validation schemas
const assignmentFiltersSchema = z.object({
  observerId: z.string().uuid().optional(),
  pollingStationId: z.string().uuid().optional(),
  electionId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

const createAssignmentSchema = z.object({
  observerRegistrationId: z.string().uuid(),
  pollingStationId: z.string().uuid(),
  assignmentNotes: z.string().max(500).optional(),
});

const updateAssignmentSchema = z.object({
  pollingStationId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  deactivationReason: z.string().max(500).optional(),
});

export class ObserverAssignmentsController {
  constructor(
    private observerAssignmentsService: ObserverAssignmentsService
  ) {}

  /**
   * GET /api/v1/admin/observer-assignments
   * Get all assignments with optional filtering
   */
  getAssignments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = assignmentFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError(
          `Invalid filters: ${validationResult.error.errors
            .map((e) => e.message)
            .join(', ')}`
        );
      }

      const filters: AssignmentFilters = validationResult.data;
      const assignments = await this.observerAssignmentsService.getAssignments(
        filters
      );

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/observer-assignments/:id
   * Get assignment by ID
   */
  getAssignmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const assignment =
        await this.observerAssignmentsService.getAssignmentById(id);

      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/observer-assignments
   * Create new assignment
   */
  createAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = createAssignmentSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new ValidationError(
          `Validation failed: ${validationResult.error.errors
            .map((e) => e.message)
            .join(', ')}`
        );
      }

      const data: CreateAssignmentData = validationResult.data;
      const assignedBy = (req as any).user?.userId;

      if (!assignedBy) {
        throw new ValidationError('User ID not found in request');
      }

      const assignment = await this.observerAssignmentsService.createAssignment(
        data,
        assignedBy
      );

      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/observer-assignments/:id
   * Update assignment
   */
  updateAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validationResult = updateAssignmentSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new ValidationError(
          `Validation failed: ${validationResult.error.errors
            .map((e) => e.message)
            .join(', ')}`
        );
      }

      const data: UpdateAssignmentData = validationResult.data;
      const updatedBy = (req as any).user?.userId;

      if (!updatedBy) {
        throw new ValidationError('User ID not found in request');
      }

      const assignment = await this.observerAssignmentsService.updateAssignment(
        id,
        data,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Assignment updated successfully',
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/observer-assignments/:id
   * Delete assignment
   */
  deleteAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.observerAssignmentsService.deleteAssignment(id);

      res.status(200).json({
        success: true,
        message: 'Assignment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/observer-assignments/stats
   * Get assignment statistics for active contests
   */
  getStatistics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats =
        await this.observerAssignmentsService.getAssignmentStatistics();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/observer-assignments/multiple-contests
   * Get agents assigned to multiple active contests
   */
  getAgentsWithMultipleContests = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.observerAssignmentsService.getAgentsWithMultipleContests();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

