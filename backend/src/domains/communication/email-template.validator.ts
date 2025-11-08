/**
 * Email Template Validation Schemas
 */

import { z } from 'zod';

export const EmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required'),
  description: z.string().optional(),
  templateType: z.enum([
    'registration_confirmation',
    'password_setup',
    'welcome',
    'rejection',
    'clarification_request',
  ]),
  variables: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).optional(),
  description: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const RenderEmailTemplateSchema = z.object({
  templateType: z.enum([
    'registration_confirmation',
    'password_setup',
    'welcome',
    'rejection',
    'clarification_request',
  ]),
  variables: z.record(z.string(), z.string()),
});

export type EmailTemplateInput = z.infer<typeof EmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<
  typeof UpdateEmailTemplateSchema
>;
export type RenderEmailTemplateInput = z.infer<
  typeof RenderEmailTemplateSchema
>;
