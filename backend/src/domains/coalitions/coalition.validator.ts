/**
 * Coalition Validators
 * Request validation schemas using Zod
 */

import { z } from 'zod';

export const createCoalitionSchema = z.object({
  name: z.string().min(1, 'Coalition name is required'),
  abbreviation: z.string().optional(),
  description: z.string().optional(),
  isCompetitor: z.boolean().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const updateCoalitionSchema = z.object({
  name: z.string().min(1, 'Coalition name is required').optional(),
  abbreviation: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isCompetitor: z.boolean().optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const addPartiesToCoalitionSchema = z.object({
  partyIds: z.array(z.string().uuid()).min(1, 'At least one party is required'),
});

export const removePartiesFromCoalitionSchema = z.object({
  partyIds: z.array(z.string().uuid()).min(1, 'At least one party is required'),
});

