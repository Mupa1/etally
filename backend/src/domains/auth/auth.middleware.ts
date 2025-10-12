/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import AuthService from './auth.service';
import { AuthenticationError, AuthorizationError } from '@/shared/types/errors';
import { IAccessTokenPayload } from '@/shared/interfaces/auth.interface';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: IAccessTokenPayload & {
        email?: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Verify JWT token and attach user to request
   * Use this middleware on protected routes
   */
  authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AuthenticationError('No authorization token provided');
      }

      if (!authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError(
          'Invalid authorization format. Use: Bearer <token>'
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        throw new AuthenticationError('No token provided');
      }

      // Verify token
      const payload = this.authService.verifyAccessToken(token);

      // Attach user data to request
      req.user = payload;

      next();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Require specific roles
   * Use after authenticate middleware
   *
   * @param allowedRoles - Array of allowed user roles
   * @example
   * router.get('/admin', authenticate, requireRoles(['super_admin']), handler);
   */
  requireRoles = (allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new AuthenticationError('User not authenticated');
        }

        if (!allowedRoles.includes(req.user.role)) {
          throw new AuthorizationError(
            `Access denied. Required roles: ${allowedRoles.join(', ')}`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };

  /**
   * Require super admin role
   * Shorthand for requireRoles(['super_admin'])
   */
  requireSuperAdmin = this.requireRoles(['super_admin']);

  /**
   * Require admin or election manager role
   * For administrative operations
   */
  requireAdmin = this.requireRoles(['super_admin', 'election_manager']);

  /**
   * Require field observer or higher
   * For data submission operations
   */
  requireFieldObserver = this.requireRoles([
    'super_admin',
    'election_manager',
    'field_observer',
  ]);

  /**
   * Optional authentication
   * Attaches user if token is valid, but doesn't require it
   * Useful for public endpoints that behave differently for authenticated users
   */
  optionalAuthenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = this.authService.verifyAccessToken(token);
        req.user = payload;
      }

      next();
    } catch (error) {
      // Don't fail if token is invalid, just continue without user
      next();
    }
  };

  /**
   * Require user to own the resource or be admin
   * Checks if user ID in request matches the authenticated user or user is admin
   *
   * @param userIdParam - Name of the parameter containing user ID (default: 'userId')
   * @example
   * router.put('/users/:userId', authenticate, requireOwnershipOrAdmin(), handler);
   */
  requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new AuthenticationError('User not authenticated');
        }

        const resourceUserId = req.params[userIdParam];

        // Allow if user owns the resource or is admin
        const isOwner = req.user.userId === resourceUserId;
        const isAdmin = ['super_admin', 'election_manager'].includes(
          req.user.role
        );

        if (!isOwner && !isAdmin) {
          throw new AuthorizationError(
            'You can only access your own resources'
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}

// Export singleton instance
const authMiddleware = new AuthMiddleware();

export const {
  authenticate,
  optionalAuthenticate,
  requireRoles,
  requireSuperAdmin,
  requireAdmin,
  requireFieldObserver,
  requireOwnershipOrAdmin,
} = authMiddleware;

export default authMiddleware;
