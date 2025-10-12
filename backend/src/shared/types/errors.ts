/**
 * Custom Error Classes
 * Provides specific error types for different failure scenarios
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400);
    this.field = field;
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  public readonly appliedPolicies?: string[];
  public readonly evaluationTimeMs?: number;
  public readonly context?: any;

  constructor(
    message: string = 'Insufficient permissions',
    metadata?: {
      appliedPolicies?: string[];
      evaluationTimeMs?: number;
      context?: any;
    }
  ) {
    super(message, 403);
    this.name = 'AuthorizationError';
    this.appliedPolicies = metadata?.appliedPolicies;
    this.evaluationTimeMs = metadata?.evaluationTimeMs;
    this.context = metadata?.context;
  }
}

export class NotFoundError extends AppError {
  public readonly entity: string;
  public readonly id: string;

  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 404);
    this.entity = entity;
    this.id = id;
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: Date;

  constructor(message: string = 'Too many requests', retryAfter: Date) {
    super(message, 429);
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  public readonly originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message, 500, false);
    this.originalError = originalError;
    this.name = 'DatabaseError';
  }
}
