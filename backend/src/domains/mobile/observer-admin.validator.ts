/**
 * Observer Admin Validation Schemas
 * Zod schemas for observer admin operations
 */

import { z } from 'zod';

// Observer status enum validation
const observerStatusSchema = z.enum([
  'pending_review',
  'more_information_requested',
  'approved',
  'active',
  'rejected',
  'suspended',
  'inactive',
]);

// Observer filters validation
export const observerFiltersSchema = z.object({
  status: observerStatusSchema.optional(),
  location: z.string().min(1).max(100).optional(),
  registrationStatus: observerStatusSchema.optional(),
  search: z.string().min(1).max(100).optional(),
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z
    .enum(['name', 'email', 'status', 'submissionDate', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Observer update validation
export const observerUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name too long')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long')
    .optional(),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .optional(),
  status: observerStatusSchema.optional(),
  location: z.string().min(1).max(200).optional(),
  reviewNotes: z.string().max(1000, 'Review notes too long').optional(),
  rejectionReason: z.string().max(500, 'Rejection reason too long').optional(),
});

// Bulk update validation
export const bulkUpdateSchema = z.object({
  observerIds: z
    .array(z.string().uuid('Invalid observer ID format'))
    .min(1, 'At least one observer ID is required')
    .max(100, 'Cannot update more than 100 observers at once'),
  status: observerStatusSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
});

// Analytics query validation
export const analyticsQuerySchema = z.object({
  days: z.coerce
    .number()
    .min(1, 'Days must be at least 1')
    .max(365, 'Days cannot exceed 365')
    .default(30),
});

// Observer ID parameter validation
export const observerIdSchema = z.object({
  id: z.string().uuid('Invalid observer ID format'),
});

// Export filters validation (extends observer filters)
export const exportFiltersSchema = observerFiltersSchema.extend({
  format: z.enum(['csv', 'xlsx']).default('csv'),
});

// Observer assignment validation
export const observerAssignmentSchema = z.object({
  observerId: z.string().uuid('Invalid observer ID format'),
  pollingStationId: z.string().uuid('Invalid polling station ID format'),
  assignmentNotes: z.string().max(500).optional(),
});

// Observer location update validation
export const observerLocationUpdateSchema = z.object({
  preferredCountyId: z.string().uuid('Invalid county ID format').optional(),
  preferredConstituencyId: z
    .string()
    .uuid('Invalid constituency ID format')
    .optional(),
  preferredWardId: z.string().uuid('Invalid ward ID format').optional(),
  preferredStationId: z.string().uuid('Invalid station ID format').optional(),
});

// Observer review validation
export const observerReviewSchema = z
  .object({
    status: observerStatusSchema,
    reviewNotes: z.string().max(1000).optional(),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // If status is rejected, rejectionReason should be provided
      if (data.status === 'rejected' && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when rejecting an observer',
      path: ['rejectionReason'],
    }
  );

// Observer search validation
export const observerSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
  filters: z
    .object({
      status: observerStatusSchema.optional(),
      location: z.string().optional(),
      dateRange: z
        .object({
          start: z.string().datetime().optional(),
          end: z.string().datetime().optional(),
        })
        .optional(),
    })
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// Observer statistics validation
export const observerStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Type exports
export type ObserverFiltersInput = z.infer<typeof observerFiltersSchema>;
export type ObserverUpdateInput = z.infer<typeof observerUpdateSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type ObserverIdInput = z.infer<typeof observerIdSchema>;
export type ExportFiltersInput = z.infer<typeof exportFiltersSchema>;
export type ObserverAssignmentInput = z.infer<typeof observerAssignmentSchema>;
export type ObserverLocationUpdateInput = z.infer<
  typeof observerLocationUpdateSchema
>;
export type ObserverReviewInput = z.infer<typeof observerReviewSchema>;
export type ObserverSearchInput = z.infer<typeof observerSearchSchema>;
export type ObserverStatsInput = z.infer<typeof observerStatsSchema>;
