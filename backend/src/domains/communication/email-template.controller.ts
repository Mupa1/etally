/**
 * Email Template Controller
 * Handles HTTP requests for email template management
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  EmailTemplateSchema,
  UpdateEmailTemplateSchema,
  RenderEmailTemplateSchema,
} from './email-template.validator';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateType } from '@prisma/client';

export class EmailTemplateController {
  constructor(private emailTemplateService: EmailTemplateService) {}

  /**
   * GET /api/v1/communication/templates
   * Get all email templates
   */
  getTemplates = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const templates = await this.emailTemplateService.getTemplates();

      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/communication/templates/:type
   * Get template by type
   */
  getTemplateByType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { type } = req.params;

      const template = await this.emailTemplateService.getTemplateByType(
        type as EmailTemplateType
      );

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Email template not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/communication/templates/id/:id
   * Get template by ID
   */
  getTemplateById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const template = await this.emailTemplateService.getTemplateById(id);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'Email template not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/communication/templates
   * Create new template
   */
  createTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = EmailTemplateSchema.parse(req.body);
      const userId = req.user?.userId;

      const template = await this.emailTemplateService.createTemplate(
        validatedData,
        userId
      );

      res.status(201).json({
        success: true,
        data: template,
        message: 'Email template created successfully',
      });
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
   * PUT /api/v1/communication/templates/:id
   * Update template
   */
  updateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = UpdateEmailTemplateSchema.parse(req.body);
      const userId = req.user?.userId;

      const template = await this.emailTemplateService.updateTemplate(
        id,
        validatedData,
        userId
      );

      res.status(200).json({
        success: true,
        data: template,
        message: 'Email template updated successfully',
      });
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
   * DELETE /api/v1/communication/templates/:id
   * Delete template
   */
  deleteTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.emailTemplateService.deleteTemplate(id);

      res.status(200).json({
        success: true,
        message: 'Email template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/communication/templates/render
   * Render template with variables (preview)
   */
  renderTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = RenderEmailTemplateSchema.parse(req.body);

      const rendered = await this.emailTemplateService.renderTemplate(
        validatedData.templateType,
        validatedData.variables
      );

      res.status(200).json({
        success: true,
        data: rendered,
      });
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
}
