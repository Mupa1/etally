/**
 * Policy Management Validator
 * Zod validation schemas for policy management endpoints
 */

import { z } from 'zod';
import {
  UserRole,
  ResourceType,
  PermissionAction,
  PolicyEffect,
} from '@prisma/client';

/**
 * Create policy schema
 */
export const createPolicySchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),

  description: z.string().max(500).optional(),

  effect: z.nativeEnum(PolicyEffect, {
    errorMap: () => ({ message: 'Invalid policy effect' }),
  }),

  priority: z
    .number()
    .int()
    .min(0, 'Priority must be non-negative')
    .max(100, 'Priority must not exceed 100')
    .default(0),

  roles: z
    .array(z.nativeEnum(UserRole))
    .min(1, 'At least one role must be specified'),

  resourceType: z.nativeEnum(ResourceType, {
    errorMap: () => ({ message: 'Invalid resource type' }),
  }),

  actions: z
    .array(z.nativeEnum(PermissionAction))
    .min(1, 'At least one action must be specified'),

  conditions: z.any().optional(), // JSON object

  isActive: z.boolean().optional().default(true),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

/**
 * Update policy schema
 */
export const updatePolicySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  effect: z.nativeEnum(PolicyEffect).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  roles: z.array(z.nativeEnum(UserRole)).min(1).optional(),
  resourceType: z.nativeEnum(ResourceType).optional(),
  actions: z.array(z.nativeEnum(PermissionAction)).min(1).optional(),
  conditions: z.any().optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

/**
 * Create user scope schema
 */
export const createUserScopeSchema = z
  .object({
    userId: z.string().uuid('Invalid user ID'),

    scopeLevel: z.enum(['national', 'county', 'constituency', 'ward'], {
      errorMap: () => ({ message: 'Invalid scope level' }),
    }),

    countyId: z.string().uuid().optional(),
    constituencyId: z.string().uuid().optional(),
    wardId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // Validate scope level matches provided IDs
      if (data.scopeLevel === 'county') return !!data.countyId;
      if (data.scopeLevel === 'constituency') return !!data.constituencyId;
      if (data.scopeLevel === 'ward') return !!data.wardId;
      if (data.scopeLevel === 'national')
        return !data.countyId && !data.constituencyId && !data.wardId;
      return true;
    },
    {
      message: 'Scope level must match provided geographic IDs',
    }
  );

export type CreateUserScopeInput = z.infer<typeof createUserScopeSchema>;

/**
 * Grant permission schema
 */
export const grantPermissionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),

  resourceType: z.nativeEnum(ResourceType, {
    errorMap: () => ({ message: 'Invalid resource type' }),
  }),

  resourceId: z.string().uuid().optional(),

  action: z.nativeEnum(PermissionAction, {
    errorMap: () => ({ message: 'Invalid action' }),
  }),

  effect: z.nativeEnum(PolicyEffect).default('allow'),

  expiresAt: z.coerce.date().optional(),

  reason: z
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional(),
});

export type GrantPermissionInput = z.infer<typeof grantPermissionSchema>;

/**
 * Audit trail filters schema
 */
export const auditTrailFiltersSchema = z.object({
  userId: z.string().uuid().optional(),

  resourceType: z.nativeEnum(ResourceType).optional(),

  action: z.nativeEnum(PermissionAction).optional(),

  granted: z
    .string()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
    .optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),

  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
});

export type AuditTrailFiltersInput = z.infer<typeof auditTrailFiltersSchema>;
