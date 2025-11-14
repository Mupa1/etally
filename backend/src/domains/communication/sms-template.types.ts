/**
 * SMS Template Types
 */

export const smsTemplateTypes = [
  'registration_confirmation',
  'password_setup',
  'welcome',
  'rejection',
  'clarification_request',
  'election_update',
  'general_notification',
] as const;

export type SmsTemplateType = (typeof smsTemplateTypes)[number];

export interface SmsTemplateDTO {
  name: string;
  body: string;
  description?: string;
  templateType: SmsTemplateType;
  variables?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateSmsTemplateDTO {
  name?: string;
  body?: string;
  description?: string;
  variables?: Record<string, string>;
  isActive?: boolean;
}

export interface SmsTemplateResponse {
  id: string;
  name: string;
  body: string;
  description?: string;
  templateType: SmsTemplateType;
  variables?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface RenderSmsTemplateDTO {
  templateType: SmsTemplateType;
  variables: Record<string, string>;
}

export interface RenderedSms {
  body: string;
}

