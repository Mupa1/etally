/**
 * Authentication Interfaces
 * Type definitions for authentication-related data structures
 */

import { UserRole } from '@prisma/client';

export interface IUser {
  id: string;
  nationalId: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  failedLoginAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAccessTokenPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
}

export interface IRefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
  deviceInfo?: IDeviceInfo;
}

export interface IRegisterRequest {
  nationalId: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface IDeviceInfo {
  deviceId?: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  ip?: string;
  userAgent?: string;
}

export interface ISession {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  deviceInfo?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IAuthResponse {
  user: Omit<IUser, 'passwordHash' | 'mfaSecret' | 'failedLoginAttempts'>;
  tokens: IAuthTokens;
  requiresPasswordChange?: boolean;
}

export interface IPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface IFirstLoginPasswordChangeRequest {
  newPassword: string;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IPasswordResetConfirm {
  token: string;
  newPassword: string;
}
