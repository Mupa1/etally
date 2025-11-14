/**
 * Security Logger
 * Structured logging for security events and audit trails
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
const logDir = process.env.LOG_DIR || '/var/log/api';
const isDevelopment = process.env.NODE_ENV === 'development';

// Create log directory if it doesn't exist
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  console.error(`Failed to create log directory ${logDir}:`, error);
  // Fallback to current directory in development
  if (isDevelopment) {
    const fallbackDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
  }
}

/**
 * Security event logger - writes to daily rotating files
 */
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Daily rotating file for security logs
    new DailyRotateFile({
      filename: path.join(logDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d', // Keep logs for 30 days
      zippedArchive: true,
    }),
    // Also log to console in development
    ...(isDevelopment
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]
      : []),
  ],
});

/**
 * Application logger - for general application logs
 */
const appLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // Keep app logs for 14 days
      zippedArchive: true,
    }),
    ...(isDevelopment
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]
      : []),
  ],
});

/**
 * Security event details interface
 */
export interface SecurityEventDetails {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a security event
 */
export const logSecurityEvent = (
  eventType: string,
  details: SecurityEventDetails
): void => {
  securityLogger.info({
    eventType,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log login attempt (success or failure)
 */
export const logLoginAttempt = (
  identifier: string,
  ipAddress: string,
  success: boolean,
  userId?: string,
  reason?: string
): void => {
  logSecurityEvent('login_attempt', {
    userId,
    email: identifier.includes('@') ? identifier : undefined,
    ipAddress,
    action: 'login',
    success,
    reason,
  });
};

/**
 * Log successful login with additional context
 */
export const logLoginSuccess = (
  userId: string,
  email: string,
  ipAddress: string,
  userAgent?: string,
  metadata?: Record<string, any>
): void => {
  logSecurityEvent('login_success', {
    userId,
    email,
    ipAddress,
    userAgent,
    action: 'login',
    success: true,
    metadata,
  });
};

/**
 * Log logout event
 */
export const logLogout = (
  userId: string,
  ipAddress: string,
  userAgent?: string
): void => {
  logSecurityEvent('logout', {
    userId,
    ipAddress,
    userAgent,
    action: 'logout',
    success: true,
  });
};

/**
 * Log data modification (CREATE, UPDATE, DELETE)
 */
export const logDataModification = (
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resource: string,
  resourceId: string,
  ipAddress?: string,
  before?: any,
  after?: any
): void => {
  logSecurityEvent('data_modification', {
    userId,
    action,
    resource,
    resourceId,
    ipAddress,
    metadata: {
      before: before ? JSON.stringify(before) : undefined,
      after: after ? JSON.stringify(after) : undefined,
    },
  });
};

/**
 * Log privilege escalation (role change)
 */
export const logPrivilegeChange = (
  _userId: string, // Changed by user ID (for future use)
  targetUserId: string,
  oldRole: string,
  newRole: string,
  changedBy: string,
  ipAddress?: string
): void => {
  logSecurityEvent('privilege_change', {
    userId: targetUserId,
    action: 'role_change',
    resource: 'user',
    resourceId: targetUserId,
    ipAddress,
    metadata: {
      oldRole,
      newRole,
      changedBy,
    },
  });
};

/**
 * Log account lockout
 */
export const logAccountLockout = (
  userId: string,
  email: string,
  ipAddress: string,
  reason: string
): void => {
  logSecurityEvent('account_lockout', {
    userId,
    email,
    ipAddress,
    action: 'account_lockout',
    success: false,
    reason,
  });
};

/**
 * Log suspicious activity
 */
export const logSuspiciousActivity = (
  eventType: string,
  details: SecurityEventDetails
): void => {
  logSecurityEvent(`suspicious_${eventType}`, {
    ...details,
    metadata: {
      ...details.metadata,
      severity: 'high',
    },
  });
};

/**
 * Application logger (for non-security logs)
 */
export const logger = appLogger;

/**
 * Export security logger for direct access if needed
 */
export { securityLogger };

