import { z } from 'zod';
import { smsTemplateTypes } from './sms-template.types';

export const SmsTemplateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  body: z.string().min(5, 'Template body must be at least 5 characters'),
  description: z.string().optional(),
  templateType: z.enum(smsTemplateTypes),
  variables: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSmsTemplateSchema = z.object({
  name: z.string().min(3).optional(),
  body: z.string().min(5).optional(),
  description: z.string().optional(),
  variables: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const RenderSmsTemplateSchema = z.object({
  templateType: z.enum(smsTemplateTypes),
  variables: z.record(z.string()).default({}),
});

