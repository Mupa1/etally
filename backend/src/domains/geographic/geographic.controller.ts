/**
 * Geographic Controller
 * Handles HTTP requests for geographic endpoints
 */

import { Request, Response, NextFunction } from 'express';
import GeographicService from './geographic.service';
import {
  bulkUploadSchema,
  geographicFiltersSchema,
  statisticsFiltersSchema,
  pollingStationSearchSchema,
  hierarchyFiltersSchema,
} from './geographic.validator';
import { IBulkUploadChunk } from './geographic.types';
import { ValidationError } from '@/shared/types/errors';

class GeographicController {
  private geographicService: GeographicService;

  constructor() {
    this.geographicService = new GeographicService();
  }

  /**
   * Bulk upload geographic data
   * POST /api/v1/geographic/bulk-upload
   */
  bulkUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate request body
      const validationResult = bulkUploadSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const result = await this.geographicService.bulkUpload(
        validationResult.data as IBulkUploadChunk
      );

      res.status(200).json({
        success: true,
        message: 'Bulk upload completed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all counties with nested data
   * GET /api/v1/geographic/counties
   */
  getCounties = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = geographicFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const counties = await this.geographicService.getCounties(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Counties retrieved successfully',
        data: counties,
        count: counties.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all constituencies with nested data
   * GET /api/v1/geographic/constituencies
   */
  getConstituencies = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = geographicFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const constituencies = await this.geographicService.getConstituencies(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Constituencies retrieved successfully',
        data: constituencies,
        count: constituencies.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all wards with nested data
   * GET /api/v1/geographic/wards
   */
  getWards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = geographicFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const wards = await this.geographicService.getWards(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Wards retrieved successfully',
        data: wards,
        count: wards.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all polling stations with nested data
   * GET /api/v1/geographic/polling-stations
   */
  getPollingStations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = geographicFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const pollingStations = await this.geographicService.getPollingStations(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Polling stations retrieved successfully',
        data: pollingStations,
        count: pollingStations.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get geographic statistics (legacy)
   * GET /api/v1/geographic/stats
   */
  getStatistics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.geographicService.getStatistics();

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get comprehensive voting area statistics
   * GET /api/v1/geographic/voting-stats
   */
  getVotingAreaStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = statisticsFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const stats = await this.geographicService.getVotingAreaStatistics(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Voting area statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search and filter polling stations
   * GET /api/v1/geographic/search
   */
  searchPollingStations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = pollingStationSearchSchema.safeParse(req.query);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const result = await this.geographicService.searchPollingStations(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Polling stations retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get hierarchical data with drill-down support
   * GET /api/v1/geographic/hierarchy
   */
  getHierarchyData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validationResult = hierarchyFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const result = await this.geographicService.getHierarchyData(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Hierarchy data retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default GeographicController;
