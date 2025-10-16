/**
 * Geographic Validator
 * Zod validation schemas for geographic endpoints
 */

import { z } from 'zod';

/**
 * Bulk upload schema
 */
export const bulkUploadSchema = z.object({
  data: z.array(
    z.object({
      countyCode: z.string().min(1, 'County code is required'),
      countyName: z.string().min(1, 'County name is required'),
      constituencyCode: z.string().min(1, 'Constituency code is required'),
      constituencyName: z.string().min(1, 'Constituency name is required'),
      wardCode: z.string().min(1, 'Ward code is required'),
      wardName: z.string().min(1, 'Ward name is required'),
      regCenterCode: z.string().optional(),
      regCenterName: z.string().optional(),
      pollingStationCode: z.string().min(1, 'Polling station code is required'),
      pollingStationName: z.string().min(1, 'Polling station name is required'),
      registeredVoters: z
        .number()
        .int()
        .min(0, 'Registered voters must be non-negative'),
    })
  ),
  chunkIndex: z.number().int().min(0),
  totalChunks: z.number().int().min(1),
});

export type BulkUploadInput = z.infer<typeof bulkUploadSchema>;

/**
 * Geographic filters schema
 */
export const geographicFiltersSchema = z.object({
  countyId: z.string().uuid().optional(),
  constituencyId: z.string().uuid().optional(),
  wardId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type GeographicFiltersInput = z.infer<typeof geographicFiltersSchema>;

/**
 * Statistics filters schema
 */
export const statisticsFiltersSchema = z.object({
  countyId: z.string().uuid().optional(),
  constituencyId: z.string().uuid().optional(),
  wardId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type StatisticsFiltersInput = z.infer<typeof statisticsFiltersSchema>;

/**
 * Polling station search filters schema
 */
export const pollingStationSearchSchema = z.object({
  countyId: z.string().uuid().optional(),
  constituencyId: z.string().uuid().optional(),
  wardId: z.string().uuid().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z
    .enum(['name', 'code', 'registeredVoters'])
    .optional()
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type PollingStationSearchInput = z.infer<
  typeof pollingStationSearchSchema
>;

/**
 * Hierarchy navigation schema
 */
export const hierarchyFiltersSchema = z.object({
  level: z.enum(['county', 'constituency', 'ward', 'polling_station']),
  countyId: z.string().uuid().optional(),
  constituencyId: z.string().uuid().optional(),
  wardId: z.string().uuid().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
});

export type HierarchyFiltersInput = z.infer<typeof hierarchyFiltersSchema>;
