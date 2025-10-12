/**
 * Error Handling Middleware
 * Global error handler for Express application
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/types/errors';
import { Prisma } from '@prisma/client';

/**
 * Format error response
 */
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
  stack?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: isDevelopment ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle custom application errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    // Include ABAC metadata for authorization errors
    if (error.name === 'AuthorizationError') {
      const authError = error as any;
      if (authError.appliedPolicies) {
        response.details = {
          appliedPolicies: authError.appliedPolicies,
          evaluationTimeMs: authError.evaluationTimeMs,
        };
      }
    }

    if (isDevelopment) {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database error occurred';
    let statusCode = 500;

    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.join(', ') || 'field';
        message = `${field} already exists`;
        statusCode = 409;
        break;
      case 'P2025':
        // Record not found
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        // Foreign key constraint violation
        message = 'Referenced record does not exist';
        statusCode = 400;
        break;
      default:
        message = isDevelopment ? error.message : 'Database error';
    }

    const response: ErrorResponse = {
      success: false,
      error: 'DatabaseError',
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    if (isDevelopment) {
      response.details = {
        code: error.code,
        meta: error.meta,
      };
      response.stack = error.stack;
    }

    res.status(statusCode).json(response);
    return;
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const response: ErrorResponse = {
      success: false,
      error: 'ValidationError',
      message: isDevelopment ? error.message : 'Invalid data provided',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    if (isDevelopment) {
      response.stack = error.stack;
    }

    res.status(400).json(response);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response: ErrorResponse = {
      success: false,
      error: 'AuthenticationError',
      message: 'Invalid authentication token',
      statusCode: 401,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response: ErrorResponse = {
      success: false,
      error: 'AuthenticationError',
      message: 'Authentication token has expired',
      statusCode: 401,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    res.status(401).json(response);
    return;
  }

  // Handle generic errors
  const response: ErrorResponse = {
    success: false,
    error: 'InternalServerError',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  if (isDevelopment) {
    response.stack = error.stack;
  }

  res.status(500).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.path}`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};
