/**
 * Email Template Types
 */

import { EmailTemplateType } from '@prisma/client';

export interface EmailTemplateDTO {
  name: string;
  subject: string;
  body: string;
  description?: string;
  templateType: EmailTemplateType;
  variables?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateEmailTemplateDTO {
  name?: string;
  subject?: string;
  body?: string;
  description?: string;
  variables?: Record<string, string>;
  isActive?: boolean;
}

export interface EmailTemplateResponse {
  id: string;
  name: string;
  subject: string;
  body: string;
  description?: string;
  templateType: EmailTemplateType;
  variables?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface RenderEmailTemplateDTO {
  templateType: EmailTemplateType;
  variables: Record<string, string>;
}

export interface RenderedEmail {
  subject: string;
  body: string;
}
