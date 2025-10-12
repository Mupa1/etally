/**
 * Election Controller
 * Handles HTTP requests for election endpoints
 */

import { Request, Response, NextFunction } from 'express';
import ElectionService from './election.service';
import {
  createElectionSchema,
  updateElectionSchema,
  electionFiltersSchema,
} from './election.validator';
import { ValidationError } from '@/shared/types/errors';

class ElectionController {
  private electionService: ElectionService;

  constructor() {
    this.electionService = new ElectionService();
  }

  /**
   * Create new election
   * POST /api/v1/elections
   */
  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate request body
      const validationResult = createElectionSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const election = await this.electionService.createElection(
        req.user.userId,
        req.user.role,
        validationResult.data
      );

      res.status(201).json({
        success: true,
        message: 'Election created successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all elections
   * GET /api/v1/elections
   */
  list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate query params
      const validationResult = electionFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError('Invalid filter parameters');
      }

      const elections = await this.electionService.listElections(
        req.user.userId,
        req.user.role,
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Elections retrieved successfully',
        data: elections,
        count: Array.isArray(elections) ? elections.length : 0,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get election by ID
   * GET /api/v1/elections/:id
   */
  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const election = await this.electionService.getElectionById(
        req.user.userId,
        req.user.role,
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: 'Election retrieved successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update election
   * PUT /api/v1/elections/:id
   */
  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate request body
      const validationResult = updateElectionSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const election = await this.electionService.updateElection(
        req.user.userId,
        req.user.role,
        req.params.id,
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Election updated successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete election
   * DELETE /api/v1/elections/:id
   */
  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const election = await this.electionService.deleteElection(
        req.user.userId,
        req.user.role,
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: 'Election deleted successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve election
   * POST /api/v1/elections/:id/approve
   */
  approve = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const election = await this.electionService.approveElection(
        req.user.userId,
        req.user.role,
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: 'Election approved successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get election statistics
   * GET /api/v1/elections/stats
   */
  getStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const stats = await this.electionService.getElectionStats(
        req.user.userId,
        req.user.role
      );

      res.status(200).json({
        success: true,
        message: 'Election statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ElectionController;

