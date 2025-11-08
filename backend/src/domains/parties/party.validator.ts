/**
 * Political Party Validators
 * Request validation schemas using Zod
 */

import { z } from 'zod';

export const createPartySchema = z.object({
  serialNumber: z.string().optional(),
  certificateNumber: z.string().min(1, 'Certificate number is required'),
  partyName: z.string().min(1, 'Party name is required'),
  abbreviation: z.string().optional(),
  certificateDate: z.string().optional(),
  symbol: z.string().optional(),
  colors: z.string().optional(),
  postalAddress: z.string().optional(),
  headOfficeLocation: z.string().optional(),
  slogan: z.string().optional(),
  changes: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  affiliation: z
    .enum(['main_party', 'friendly_party', 'competitor'])
    .optional(),
  isActive: z.boolean().optional(),
});

export const updatePartySchema = z.object({
  serialNumber: z.string().nullable().optional(),
  partyName: z.string().min(1).optional(),
  abbreviation: z.string().nullable().optional(),
  certificateDate: z.string().nullable().optional(),
  symbol: z.string().nullable().optional(),
  colors: z.string().nullable().optional(),
  postalAddress: z.string().nullable().optional(),
  headOfficeLocation: z.string().nullable().optional(),
  slogan: z.string().nullable().optional(),
  changes: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal('')),
  primaryColor: z.string().nullable().optional(),
  affiliation: z
    .enum(['main_party', 'friendly_party', 'competitor'])
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const partyFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  abbreviation: z.string().optional(),
});

export const bulkUploadSchema = z.array(
  z.object({
    'S/No': z.string().optional(),
    'Certificate Serial No.': z.string().min(1),
    'Name of the Party': z.string().min(1),
    Abbreviation: z.string().optional(),
    'Certificate Date of Issue': z.string().optional(),
    Symbol: z.string().optional(),
    Colors: z.string().optional(),
    'Postal Address of Party': z.string().optional(),
    'Location of Head Office of Party': z.string().optional(),
    Slogan: z.string().optional(),
    Changes: z.string().optional(),
  })
);

export type CreatePartyInput = z.infer<typeof createPartySchema>;
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;
export type PartyFilters = z.infer<typeof partyFiltersSchema>;
export type BulkUploadInput = z.infer<typeof bulkUploadSchema>;
