/**
 * Configuration Management Controller
 * HTTP handlers for configuration management
 */

import { Request, Response, NextFunction } from 'express';
import ConfigurationService from './configuration.service';
import {
  createConfigurationSchema,
  updateConfigurationSchema,
  updateConfigurationValueSchema,
  configurationFiltersSchema,
  sendTestSmsSchema,
} from './configuration.validator';
import { ValidationError } from '@/shared/types/errors';
import { SmsService } from '@/domains/mobile/sms.service';

class ConfigurationController {
  private configurationService: ConfigurationService;
  private smsService: SmsService;

  constructor() {
    this.configurationService = new ConfigurationService();
    this.smsService = new SmsService();
  }

  /**
   * Create configuration
   * POST /api/v1/configurations
   */
  createConfiguration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validationResult = createConfigurationSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const configuration = await this.configurationService.createConfiguration(
        req.user.userId,
        validationResult.data
      );

      res.status(201).json({
        success: true,
        message: 'Configuration created successfully',
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all configurations
   * GET /api/v1/configurations
   */
  getConfigurations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = configurationFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError('Invalid filter parameters');
      }

      const configurations = await this.configurationService.getConfigurations(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Configurations retrieved successfully',
        data: configurations,
        count: configurations.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get configuration by ID
   * GET /api/v1/configurations/:id
   */
  getConfiguration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const configuration =
        await this.configurationService.getConfigurationById(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Configuration retrieved successfully',
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get configuration by key
   * GET /api/v1/configurations/key/:key
   */
  getConfigurationByKey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const configuration =
        await this.configurationService.getConfigurationByKey(req.params.key);

      res.status(200).json({
        success: true,
        message: 'Configuration retrieved successfully',
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get configurations by category
   * GET /api/v1/configurations/category/:category
   */
  getConfigurationsByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const configurations =
        await this.configurationService.getConfigurationsByCategory(
          req.params.category
        );

      res.status(200).json({
        success: true,
        message: 'Configurations retrieved successfully',
        data: configurations,
        count: configurations.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update configuration
   * PUT /api/v1/configurations/:id
   */
  updateConfiguration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validationResult = updateConfigurationSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const configuration = await this.configurationService.updateConfiguration(
        req.params.id,
        req.user.userId,
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update configuration value by key
   * PATCH /api/v1/configurations/key/:key
   */
  updateConfigurationValue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validationResult = updateConfigurationValueSchema.safeParse(
        req.body
      );

      if (!validationResult.success) {
        throw new ValidationError('Invalid value');
      }

      const configuration =
        await this.configurationService.updateConfigurationValue(
          req.params.key,
          req.user.userId,
          validationResult.data.value
        );

      res.status(200).json({
        success: true,
        message: 'Configuration value updated successfully',
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete configuration
   * DELETE /api/v1/configurations/:id
   */
  deleteConfiguration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.configurationService.deleteConfiguration(
        req.params.id
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get configuration categories
   * GET /api/v1/configurations/categories/list
   */
  getCategories = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const categories = await this.configurationService.getCategories();

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk create configurations
   * POST /api/v1/configurations/bulk
   */
  bulkCreateConfigurations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      if (!Array.isArray(req.body)) {
        throw new ValidationError('Request body must be an array');
      }

      const results = await this.configurationService.bulkCreateConfigurations(
        req.user.userId,
        req.body
      );

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      res.status(201).json({
        success: true,
        message: `Bulk creation completed: ${successCount} successful, ${failureCount} failed`,
        data: results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset configuration to default
   * POST /api/v1/configurations/:id/reset
   */
  resetToDefault = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const configuration = await this.configurationService.resetToDefault(
        req.params.id,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: 'Configuration reset to default successfully',
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send a diagnostic test SMS using current configuration
   * POST /api/v1/configurations/sms/test
   */
  sendTestSms = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = sendTestSmsSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const { phoneNumber, message } = validationResult.data;

      const result = await this.smsService.sendTestSms(phoneNumber, message);

      res.status(200).json({
        success: true,
        message: `Test SMS sent successfully to ${phoneNumber}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ConfigurationController;
