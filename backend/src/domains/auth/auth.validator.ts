/**
 * Authentication Validators
 * Zod schemas for validating authentication requests
 */

import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(
    parseInt(process.env.MIN_PASSWORD_LENGTH || '8'),
    'Password must be at least 8 characters'
  )
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Password must contain at least one special character'
  );

// Device info schema
const deviceInfoSchema = z
  .object({
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
    deviceModel: z.string().optional(),
    osVersion: z.string().optional(),
    appVersion: z.string().optional(),
    ip: z.string().ip().optional(),
    userAgent: z.string().optional(),
  })
  .optional();

// Login request schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  deviceInfo: deviceInfoSchema,
});

// Register request schema
export const registerSchema = z.object({
  nationalId: z
    .string()
    .regex(/^\d{7,8}$/, 'National ID must be 7 or 8 digits'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z
    .string()
    .regex(/^\+254[17]\d{8}$/, 'Phone number must be valid Kenyan number (+254...)')
    .optional(),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  password: passwordSchema,
});

// Refresh token request schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Change password request schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// First-login password change schema (for initial super admin)
export const firstLoginPasswordChangeSchema = z.object({
  newPassword: passwordSchema,
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Password reset confirm schema
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type FirstLoginPasswordChangeInput = z.infer<typeof firstLoginPasswordChangeSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
