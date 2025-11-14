/**
 * Authentication Types
 * TypeScript interfaces for auth-related data
 */

export type UserRole = 'super_admin' | 'election_manager' | 'field_observer' | 'public_viewer';

export interface User {
  id: string;
  nationalId: string;
  email?: string | null;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  identifier?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  password: string;
  deviceInfo?: {
    deviceName?: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
  };
}

export interface RegisterRequest {
  nationalId: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  requiresPasswordChange?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface FirstLoginPasswordChangeRequest {
  newPassword: string;
}
