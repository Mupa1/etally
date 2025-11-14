/**
 * SMS Template Service
 * Handles CRUD and rendering logic for SMS templates
 */

import { PrismaClient } from '@prisma/client';
import {
  SmsTemplateDTO,
  UpdateSmsTemplateDTO,
  SmsTemplateResponse,
  RenderedSms,
  SmsTemplateType,
} from './sms-template.types';

export class SmsTemplateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Fetch all SMS templates
   */
  async getTemplates(): Promise<SmsTemplateResponse[]> {
    const templates = await this.repository.findMany({
      orderBy: { name: 'asc' },
    });
    return templates.map((template: any) => this.mapToResponse(template));
  }

  /**
   * Fetch template by ID
   */
  async getTemplateById(id: string): Promise<SmsTemplateResponse | null> {
    const template = await this.repository.findUnique({
      where: { id },
    });
    return template ? this.mapToResponse(template as any) : null;
  }

  /**
   * Fetch template by type
   */
  async getTemplateByType(
    templateType: SmsTemplateType
  ): Promise<SmsTemplateResponse | null> {
    const template = await this.repository.findUnique({
      where: { templateType },
    });
    return template ? this.mapToResponse(template) : null;
  }

  /**
   * Create new template
   */
  async createTemplate(
    data: SmsTemplateDTO,
    userId?: string
  ): Promise<SmsTemplateResponse> {
    const template = await this.repository.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return this.mapToResponse(template);
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: UpdateSmsTemplateDTO,
    userId?: string
  ): Promise<SmsTemplateResponse> {
    const template = await this.repository.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    return this.mapToResponse(template);
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.repository.delete({
      where: { id },
    });
  }

  /**
   * Render SMS template body with provided variables
   */
  async renderTemplate(
    templateType: SmsTemplateType,
    variables: Record<string, string>
  ): Promise<RenderedSms> {
    const template = await this.repository.findUnique({
      where: { templateType },
    });

    if (!template) {
      throw new Error(`SMS template not found: ${templateType}`);
    }

    if (!template.isActive) {
      throw new Error(`SMS template is inactive: ${templateType}`);
    }

    let body = template.body;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(regex, variables[key]);
    });

    return { body };
  }

  /**
   * Map Db model to response
   */
  private mapToResponse(template: any): SmsTemplateResponse {
    return {
      id: template.id,
      name: template.name,
      body: template.body,
      description: template.description,
      templateType: template.templateType,
      variables: template.variables || undefined,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.createdBy,
      updatedBy: template.updatedBy,
    };
  }
  private get repository() {
    return (this.prisma as any).smsTemplate;
  }
}

