/**
 * Election Validator
 * Zod validation schemas for election endpoints
 */

import { z } from 'zod';
import {
  ElectionType,
  ElectionStatus,
  ElectionScopeLevel,
  ReferendumQuestionType,
} from '@prisma/client';

/**
 * Create election schema
 */
export const createElectionSchema = z
  .object({
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

    parentElectionId: z.string().uuid().nullable().optional(),

    nominationOpenDate: z.coerce.date().optional(),
    nominationCloseDate: z.coerce.date().optional(),
    partyListDeadline: z.coerce.date().optional(),
    observerCallDate: z.coerce.date().optional(),
    observerAppDeadline: z.coerce.date().optional(),
    observerReviewDeadline: z.coerce.date().optional(),
    tallyingStartDate: z.coerce.date().optional(),
    tallyingEndDate: z.coerce.date().optional(),
    resultsPublishDate: z.coerce.date().optional(),

    scopeLevel: z.nativeEnum(ElectionScopeLevel).optional(),
    countyId: z.string().uuid().nullable().optional(),
    constituencyId: z.string().uuid().nullable().optional(),
    wardId: z.string().uuid().nullable().optional(),

    contests: z
      .array(
        z.object({
          positionName: z
            .string()
            .min(3, 'Contest position name must be at least 3 characters')
            .max(200, 'Contest position name must not exceed 200 characters'),
          description: z.string().max(1000).optional(),
          orderIndex: z.coerce.number().int().min(0).optional(),
        })
      )
      .optional(),

    referendumQuestions: z
      .array(
        z.object({
          questionText: z
            .string()
            .min(5, 'Referendum question must be at least 5 characters')
            .max(2000, 'Referendum question must not exceed 2000 characters'),
          questionType: z
            .nativeEnum(ReferendumQuestionType)
            .default(ReferendumQuestionType.yes_no),
          orderIndex: z.coerce.number().int().min(0).optional(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.electionType === 're_run_election' && !data.parentElectionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['parentElectionId'],
        message: 'Parent election is required for a re-run election',
      });
    }

    // Scope validation - skip for by-elections as they don't have election-level scope
    // By-elections will have geographic coverage at the contest level
    if (data.electionType !== 'by_election') {
      if (data.scopeLevel === 'county' && !data.countyId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['countyId'],
          message: 'County selection is required for county-wide coverage',
        });
      }

      if (data.scopeLevel === 'constituency' && !data.constituencyId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['constituencyId'],
          message: 'Constituency selection is required for constituency-wide coverage',
        });
      }

      if (data.scopeLevel === 'county_assembly' && !data.wardId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['wardId'],
          message: 'Ward selection is required for county assembly coverage',
        });
      }
    }

    // Note: Contests & scope step has been removed from the UI.
    // All election types (including referendums and by-elections) can be created
    // without contests/questions at creation time.
    // They can be added later via the election detail page:
    // - By-elections: contests added via CSV upload or manual input
    // - Referendums: questions can be added later
    // - Other types: contests can be added later
  });

export type CreateElectionInput = z.infer<typeof createElectionSchema>;

/**
 * Update election schema
 */
export const updateElectionSchema = z
  .object({
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

    electionType: z.nativeEnum(ElectionType).optional(),

    parentElectionId: z.string().uuid().nullable().optional(),

    nominationOpenDate: z.coerce.date().optional().nullable(),
    nominationCloseDate: z.coerce.date().optional().nullable(),
    partyListDeadline: z.coerce.date().optional().nullable(),
    observerCallDate: z.coerce.date().optional().nullable(),
    observerAppDeadline: z.coerce.date().optional().nullable(),
    observerReviewDeadline: z.coerce.date().optional().nullable(),
    tallyingStartDate: z.coerce.date().optional().nullable(),
    tallyingEndDate: z.coerce.date().optional().nullable(),
    resultsPublishDate: z.coerce.date().optional().nullable(),

    scopeLevel: z.nativeEnum(ElectionScopeLevel).optional().nullable(),
    countyId: z.string().uuid().nullable().optional(),
    constituencyId: z.string().uuid().nullable().optional(),
    wardId: z.string().uuid().nullable().optional(),

    contests: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          positionName: z
            .string()
            .min(3, 'Contest position name must be at least 3 characters')
            .max(200, 'Contest position name must not exceed 200 characters'),
          description: z.string().max(1000).optional(),
          orderIndex: z.coerce.number().int().min(0).optional(),
        })
      )
      .optional(),

    referendumQuestions: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          questionText: z
            .string()
            .min(5, 'Referendum question must be at least 5 characters')
            .max(2000, 'Referendum question must not exceed 2000 characters'),
          questionType: z
            .nativeEnum(ReferendumQuestionType)
            .default(ReferendumQuestionType.yes_no),
          orderIndex: z.coerce.number().int().min(0).optional(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scopeLevel === 'county' && !data.countyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['countyId'],
        message: 'County selection is required for county-wide coverage',
      });
    }

    if (data.scopeLevel === 'constituency' && !data.constituencyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['constituencyId'],
        message: 'Constituency selection is required for constituency-wide coverage',
      });
    }

    if (data.scopeLevel === 'county_assembly' && !data.wardId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wardId'],
        message: 'Ward selection is required for county assembly coverage',
      });
    }
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

  wardId: z.string().uuid().optional(),

  // Pagination (for future)
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ElectionFiltersInput = z.infer<typeof electionFiltersSchema>;
