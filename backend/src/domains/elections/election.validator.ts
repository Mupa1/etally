/**
 * Election Validator
 * Zod validation schemas for election endpoints
 */

import { z } from 'zod';
import { ElectionType, ElectionStatus } from '@prisma/client';

/**
 * Create election schema
 */
export const createElectionSchema = z.object({
  electionCode: z
    .string()
    .min(3, 'Election code must be at least 3 characters')
    .max(50, 'Election code must not exceed 50 characters')
    .regex(
      /^[A-Z0-9_-]+$/,
      'Election code must contain only uppercase letters, numbers, hyphens, and underscores'
    ),

  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),

  electionType: z.nativeEnum(ElectionType, {
    errorMap: () => ({
      message: 'Invalid election type',
    }),
  }),

  electionDate: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Election date must be in the future',
  }),

  description: z.string().max(1000).optional(),
});

export type CreateElectionInput = z.infer<typeof createElectionSchema>;

/**
 * Update election schema
 */
export const updateElectionSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),

  electionDate: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: 'Election date must be in the future',
    })
    .optional(),

  description: z.string().max(1000).optional(),

  status: z.nativeEnum(ElectionStatus).optional(),
});

export type UpdateElectionInput = z.infer<typeof updateElectionSchema>;

/**
 * Election filters schema (for list endpoint)
 */
export const electionFiltersSchema = z.object({
  status: z
    .union([
      z.nativeEnum(ElectionStatus),
      z.array(z.nativeEnum(ElectionStatus)),
    ])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') {
        return val as ElectionStatus;
      }
      return val;
    }),

  electionType: z.nativeEnum(ElectionType).optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),

  countyId: z.string().uuid().optional(),

  constituencyId: z.string().uuid().optional(),

  // Pagination (for future)
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ElectionFiltersInput = z.infer<typeof electionFiltersSchema>;
