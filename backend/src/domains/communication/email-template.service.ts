/**
 * Email Template Service
 * Manages email template CRUD operations and rendering
 */

import { PrismaClient, EmailTemplateType } from '@prisma/client';
import {
  EmailTemplateDTO,
  UpdateEmailTemplateDTO,
  EmailTemplateResponse,
  RenderedEmail,
} from './email-template.types';

export class EmailTemplateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all email templates
   */
  async getTemplates(): Promise<EmailTemplateResponse[]> {
    const templates = await this.prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });

    return templates.map(this.mapToResponse);
  }

  /**
   * Get template by type
   */
  async getTemplateByType(
    type: EmailTemplateType
  ): Promise<EmailTemplateResponse | null> {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { templateType: type },
    });

    return template ? this.mapToResponse(template) : null;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<EmailTemplateResponse | null> {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });

    return template ? this.mapToResponse(template) : null;
  }

  /**
   * Create new template
   */
  async createTemplate(
    data: EmailTemplateDTO,
    userId?: string
  ): Promise<EmailTemplateResponse> {
    const template = await this.prisma.emailTemplate.create({
      data: {
        ...data,
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
    data: UpdateEmailTemplateDTO,
    userId?: string
  ): Promise<EmailTemplateResponse> {
    const template = await this.prisma.emailTemplate.update({
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
    await this.prisma.emailTemplate.delete({
      where: { id },
    });
  }

  /**
   * Render email template with variables
   */
  async renderTemplate(
    type: EmailTemplateType,
    variables: Record<string, string>
  ): Promise<RenderedEmail> {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { templateType: type },
    });

    if (!template) {
      throw new Error(`Email template not found: ${type}`);
    }

    if (!template.isActive) {
      throw new Error(`Email template is inactive: ${type}`);
    }

    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;

    // Replace all {{variable}} placeholders
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    return { subject, body };
  }

  /**
   * Map database model to response format
   */
  private mapToResponse(template: any): EmailTemplateResponse {
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      description: template.description || undefined,
      templateType: template.templateType,
      variables: template.variables || undefined,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.createdBy || undefined,
      updatedBy: template.updatedBy || undefined,
    };
  }
}
