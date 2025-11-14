import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { SmsTemplateService } from './sms-template.service';
import type {
  SmsTemplateDTO,
  UpdateSmsTemplateDTO,
} from './sms-template.types';
import {
  SmsTemplateSchema,
  UpdateSmsTemplateSchema,
  RenderSmsTemplateSchema,
} from './sms-template.validator';

export class SmsTemplateController {
  constructor(private smsTemplateService: SmsTemplateService) {}

  getTemplates = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const templates = await this.smsTemplateService.getTemplates();
      res.status(200).json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await this.smsTemplateService.getTemplateById(id);

      if (!template) {
        res.status(404).json({
          success: false,
          message: 'SMS template not found',
        });
        return;
      }

      res.status(200).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  getTemplateByType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { type } = req.params;
      const template = await this.smsTemplateService.getTemplateByType(
        type as any
      );

      if (!template) {
        res.status(404).json({
          success: false,
          message: `SMS template not found for type: ${type}`,
        });
        return;
      }

      res.status(200).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  createTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payload: SmsTemplateDTO = SmsTemplateSchema.parse(req.body);
      const template = await this.smsTemplateService.createTemplate(
        payload,
        req.user?.userId
      );

      res.status(201).json({
        success: true,
        data: template,
        message: 'SMS template created successfully',
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

  updateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const payload: UpdateSmsTemplateDTO =
        UpdateSmsTemplateSchema.parse(req.body);
      const template = await this.smsTemplateService.updateTemplate(
        id,
        payload,
        req.user?.userId
      );

      res.status(200).json({
        success: true,
        data: template,
        message: 'SMS template updated successfully',
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

  deleteTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.smsTemplateService.deleteTemplate(id);
      res.status(200).json({
        success: true,
        message: 'SMS template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  renderTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payload = RenderSmsTemplateSchema.parse(req.body);
      const rendered = await this.smsTemplateService.renderTemplate(
        payload.templateType,
        payload.variables
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

