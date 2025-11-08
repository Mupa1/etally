/**
 * Configuration Validation Schemas
 * Zod schemas for validating configuration requests
 */

import { z } from 'zod';
import { ConfigurationType } from '@prisma/client';

export const createConfigurationSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9_]+$/, {
      message:
        'Key must contain only lowercase letters, numbers, and underscores',
    }),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  value: z.string().optional(),
  type: z.nativeEnum(ConfigurationType),
  category: z.string().min(1).max(100),
  isRequired: z.boolean().optional().default(false),
  isDefault: z.boolean().optional().default(false),
});

export const updateConfigurationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  value: z.any().optional(), // Accept any type as value can be string, number, boolean, or JSON
  type: z.nativeEnum(ConfigurationType).optional(),
  category: z.string().min(1).max(100).optional(),
  isRequired: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const updateConfigurationValueSchema = z.object({
  value: z.any(),
});

export const configurationFiltersSchema = z.object({
  category: z.string().optional(),
  type: z.nativeEnum(ConfigurationType).optional(),
  isRequired: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  search: z.string().optional(),
});

export type CreateConfigurationDTO = z.infer<typeof createConfigurationSchema>;
export type UpdateConfigurationDTO = z.infer<typeof updateConfigurationSchema>;
export type UpdateConfigurationValueDTO = z.infer<
  typeof updateConfigurationValueSchema
>;
export type ConfigurationFiltersDTO = z.infer<
  typeof configurationFiltersSchema
>;
