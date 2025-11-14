/**
 * Coalition Controller
 * Request handlers for coalition management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import CoalitionService from './coalition.service';
import {
  createCoalitionSchema,
  updateCoalitionSchema,
  addPartiesToCoalitionSchema,
  removePartiesFromCoalitionSchema,
} from './coalition.validator';
import { ValidationError } from '@/shared/types/errors';

class CoalitionController {
  private coalitionService: CoalitionService;

  constructor() {
    this.coalitionService = new CoalitionService();
  }

  /**
   * Create a new coalition
   * POST /api/v1/coalitions
   */
  createCoalition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = createCoalitionSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const coalition = await this.coalitionService.createCoalition(validationResult.data);

      res.status(201).json({
        success: true,
        message: 'Coalition created successfully',
        data: coalition,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all coalitions
   * GET /api/v1/coalitions
   */
  getCoalitions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters: any = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.isCompetitor !== undefined) {
        filters.isCompetitor = req.query.isCompetitor === 'true';
      }

      const coalitions = await this.coalitionService.getCoalitions(filters);

      res.status(200).json({
        success: true,
        data: coalitions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get coalition by ID
   * GET /api/v1/coalitions/:id
   */
  getCoalition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const coalition = await this.coalitionService.getCoalitionById(id);

      res.status(200).json({
        success: true,
        data: coalition,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update coalition
   * PUT /api/v1/coalitions/:id
   */
  updateCoalition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validationResult = updateCoalitionSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const coalition = await this.coalitionService.updateCoalition(id, validationResult.data);

      res.status(200).json({
        success: true,
        message: 'Coalition updated successfully',
        data: coalition,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete coalition
   * DELETE /api/v1/coalitions/:id
   */
  deleteCoalition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.coalitionService.deleteCoalition(id);

      res.status(200).json({
        success: true,
        message: 'Coalition deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add parties to coalition
   * POST /api/v1/coalitions/:id/parties
   */
  addParties = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validationResult = addPartiesToCoalitionSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const result = await this.coalitionService.addPartiesToCoalition(
        id,
        validationResult.data.partyIds
      );

      res.status(200).json({
        success: true,
        message: `Added ${result.added} party(s) to coalition`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove parties from coalition
   * DELETE /api/v1/coalitions/:id/parties
   */
  removeParties = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validationResult = removePartiesFromCoalitionSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      await this.coalitionService.removePartiesFromCoalition(id, validationResult.data.partyIds);

      res.status(200).json({
        success: true,
        message: 'Parties removed from coalition successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get coalition statistics
   * GET /api/v1/coalitions/statistics
   */
  getStatistics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.coalitionService.getCoalitionStatistics();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default CoalitionController;

