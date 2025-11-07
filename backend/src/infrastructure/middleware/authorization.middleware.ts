/**
 * Authorization Middleware
 * Express middleware for ABAC (Attribute-Based Access Control)
 * Integrates ABACService with Express routes
 */

import { Request, Response, NextFunction } from 'express';
import ABACService from '@/infrastructure/authorization/abac.service';
import { ResourceType, PermissionAction } from '@prisma/client';
import { AuthorizationError, AuthenticationError } from '@/shared/types/errors';
import {
  IAccessContext,
  IResourceAttributes,
} from '@/shared/interfaces/abac.interface';

// Extend Express Request type to include permission check result
declare global {
  namespace Express {
    interface Request {
      permissionCheck?: {
        granted: boolean;
        reason?: string;
        appliedPolicies: string[];
        evaluationTimeMs?: number;
      };
    }
  }
}

class AuthorizationMiddleware {
  private abac: ABACService;

  constructor() {
    this.abac = new ABACService();
  }

  /**
   * Require permission middleware factory
   * Usage: router.post('/elections', authenticate, requirePermission('election', 'create'), handler)
   */
  requirePermission(resourceType: ResourceType, action: PermissionAction) {
    const self = this;
    return async (
      req: Request,
      _res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.user) {
          throw new AuthenticationError('User not authenticated');
        }

        // Build access context from request
        const context: IAccessContext = {
          userId: req.user.userId,
          role: req.user.role,
          resourceType,
          resourceId: req.params.id,
          action,
          ipAddress: req.ip,
          deviceId: req.get('X-Device-ID'),
          latitude: self.parseFloat(req.body.latitude || req.query.latitude),
          longitude: self.parseFloat(req.body.longitude || req.query.longitude),
          timestamp: new Date(),
          resourceAttributes: self.extractResourceAttributes(req),
        };

        // Check access
        const result = await self.abac.checkAccess(context);

        if (!result.granted) {
          throw new AuthorizationError(result.reason || 'Access denied', {
            appliedPolicies: result.appliedPolicies,
            evaluationTimeMs: result.evaluationTimeMs,
          });
        }

        // Attach permission check result to request for auditing
        req.permissionCheck = result;

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Optional permission check (doesn't block request if denied)
   * Useful for features that should be available but with reduced functionality
   */
  optionalPermission(resourceType: ResourceType, action: PermissionAction) {
    const self = this;
    return async function (
      req: Request,
      _res: Response,
      next: NextFunction
    ): Promise<void> {
      try {
        if (req.user) {
          const context: IAccessContext = {
            userId: req.user.userId,
            role: req.user.role,
            resourceType,
            resourceId: req.params.id,
            action,
            ipAddress: req.ip,
            deviceId: req.get('X-Device-ID'),
            latitude: self.parseFloat(req.body.latitude || req.query.latitude),
            longitude: self.parseFloat(
              req.body.longitude || req.query.longitude
            ),
            timestamp: new Date(),
            resourceAttributes: self.extractResourceAttributes(req),
          };

          const result = await self.abac.checkAccess(context);
          req.permissionCheck = result;
        }

        next();
      } catch (error) {
        // Don't block request on error
        console.error('Optional permission check error:', error);
        next();
      }
    };
  }

  /**
   * Extract resource attributes from request
   * Collects all relevant attributes for ABAC decision
   */
  private extractResourceAttributes(req: Request): IResourceAttributes {
    return {
      // Ownership attributes
      ownerId: req.body.ownerId || req.body.createdBy || req.body.submittedBy,
      createdBy: req.body.createdBy,
      submittedBy: req.body.submittedBy,

      // Geographic attributes
      countyId: req.body.countyId || req.query.countyId,
      constituencyId: req.body.constituencyId || req.query.constituencyId,
      wardId: req.body.wardId || req.query.wardId,
      pollingStationId:
        req.body.pollingStationId ||
        req.params.pollingStationId ||
        req.query.pollingStationId,

      // Election context
      electionId:
        req.body.electionId || req.params.electionId || req.query.electionId,
      electionStatus: req.body.electionStatus || req.query.electionStatus,
      contestId: req.body.contestId || req.params.contestId,

      // Result context
      resultStatus: req.body.resultStatus || req.query.resultStatus,
      resultLevel: req.body.resultLevel,

      // Timestamps
      createdAt: req.body.createdAt ? new Date(req.body.createdAt) : undefined,
      updatedAt: req.body.updatedAt ? new Date(req.body.updatedAt) : undefined,
    };
  }

  /**
   * Parse float value safely
   */
  private parseFloat(value: any): number | undefined {
    if (!value) return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Check permission programmatically (for use in services)
   * Use this when you need to check permissions outside of route middleware
   */
  async canUser(
    userId: string,
    role: string,
    resourceType: ResourceType,
    action: PermissionAction,
    resourceId?: string,
    attributes?: IResourceAttributes
  ): Promise<boolean> {
    const result = await this.abac.checkAccess({
      userId,
      role: role as any,
      resourceType,
      resourceId,
      action,
      resourceAttributes: attributes,
    });

    return result.granted;
  }

  /**
   * Get ABAC service instance (for advanced usage)
   */
  getService(): ABACService {
    return this.abac;
  }

  /**
   * Invalidate user's permission cache
   * Call this when user roles, scopes, or permissions change
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.abac.invalidateUserCache(userId);
  }

  /**
   * Invalidate policy cache
   * Call this when policies are modified
   */
  async invalidatePolicyCache(): Promise<void> {
    await this.abac.invalidatePolicyCache();
  }
}

// Export singleton instance
const authorizationMiddleware = new AuthorizationMiddleware();

export const requirePermission = authorizationMiddleware.requirePermission.bind(
  authorizationMiddleware
);

export const optionalPermission =
  authorizationMiddleware.optionalPermission.bind(authorizationMiddleware);

export const canUser = authorizationMiddleware.canUser.bind(
  authorizationMiddleware
);

export default authorizationMiddleware;
