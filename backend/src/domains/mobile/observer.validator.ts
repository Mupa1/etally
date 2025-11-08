/**
 * Observer Registration Validation Schemas
 * Using Zod for runtime validation
 */

import { z } from 'zod';

// Kenyan phone number regex: +254XXXXXXXXX or 07XXXXXXXX or 01XXXXXXXX
const KENYAN_PHONE_REGEX = /^(\+254|0)[17]\d{8}$/;

// National ID regex: 7-8 digits
const NATIONAL_ID_REGEX = /^\d{7,8}$/;

// Registration form validation
export const ObserverRegistrationSchema = z.object({
  // Personal Information
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name too long')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters'),

  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters'),

  nationalId: z
    .string()
    .regex(NATIONAL_ID_REGEX, 'National ID must be 7-8 digits'),

  dateOfBirth: z
    .string()
    .datetime('Invalid date format')
    .refine(
      (date) => {
        const dob = new Date(date);
        const age = new Date().getFullYear() - dob.getFullYear();
        return age >= 18 && age <= 100;
      },
      { message: 'Must be at least 18 years old' }
    ),

  // Contact Information
  phoneNumber: z
    .string()
    .regex(KENYAN_PHONE_REGEX, 'Invalid Kenyan phone number format'),

  email: z.string().email('Invalid email address').toLowerCase(),

  // Preferred Assignment (all optional)
  preferredCountyId: z.string().uuid().optional(),
  preferredConstituencyId: z.string().uuid().optional(),
  preferredWardId: z.string().uuid().optional(),
  preferredStationId: z.string().uuid().optional(),

  // Consent (required)
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),

  dataProcessingConsent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to data processing',
  }),
});

export type ObserverRegistrationInput = z.infer<
  typeof ObserverRegistrationSchema
>;

// Tracking number validation
export const TrackingNumberSchema = z.object({
  trackingNumber: z
    .string()
    .regex(/^OBS-\d{4}-\d{6}$/, 'Invalid tracking number format'),
});

// Password setup validation
export const PasswordSetupSchema = z
  .object({
    token: z.string().min(32, 'Invalid token'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordSetupInput = z.infer<typeof PasswordSetupSchema>;

// Review application validation
export const ReviewApplicationSchema = z
  .object({
    action: z.enum(['approve', 'reject', 'request_clarification']),
    notes: z.string().optional(),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'reject' && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when rejecting an application',
      path: ['rejectionReason'],
    }
  );

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;

// Document upload validation
export const DocumentUploadSchema = z.object({
  documentType: z.enum([
    'national_id_front',
    'national_id_back',
    'profile_photo',
    'additional',
  ]),
});

// File type validation
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

export function validateImageFile(
  file: { size: number; mimetype: string },
  documentType: string
): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'Only JPG and PNG images are allowed',
    };
  }

  // Check file size
  const maxSize =
    documentType === 'profile_photo' ? MAX_PROFILE_PHOTO_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}
