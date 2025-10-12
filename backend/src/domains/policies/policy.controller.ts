/**
 * Policy Management Controller
 * HTTP handlers for policy, scope, and permission management
 */

import { Request, Response, NextFunction } from 'express';
import PolicyService from './policy.service';
import {
  createPolicySchema,
  updatePolicySchema,
  createUserScopeSchema,
  grantPermissionSchema,
  auditTrailFiltersSchema,
} from './policy.validator';
import { ValidationError } from '@/shared/types/errors';

class PolicyController {
  private policyService: PolicyService;

  constructor() {
    this.policyService = new PolicyService();
  }

  // ==========================================
  // POLICY MANAGEMENT
  // ==========================================

  /**
   * Create access policy
   * POST /api/v1/policies
   */
  createPolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validationResult = createPolicySchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const policy = await this.policyService.createPolicy(
        req.user.userId,
        validationResult.data
      );

      res.status(201).json({
        success: true,
        message: 'Policy created successfully',
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all policies
   * GET /api/v1/policies
   */
  listPolicies = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = {
        isActive:
          req.query.isActive === 'true'
            ? true
            : req.query.isActive === 'false'
              ? false
              : undefined,
        resourceType: req.query.resourceType as any,
        role: req.query.role as any,
      };

      const policies = await this.policyService.listPolicies(filters);

      res.status(200).json({
        success: true,
        message: 'Policies retrieved successfully',
        data: policies,
        count: policies.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get policy by ID
   * GET /api/v1/policies/:id
   */
  getPolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const policy = await this.policyService.getPolicyById(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Policy retrieved successfully',
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update policy
   * PUT /api/v1/policies/:id
   */
  updatePolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = updatePolicySchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new ValidationError('Invalid policy data');
      }

      const policy = await this.policyService.updatePolicy(
        req.params.id,
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Policy updated successfully',
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete policy
   * DELETE /api/v1/policies/:id
   */
  deletePolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.policyService.deletePolicy(req.params.id);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle policy active status
   * PATCH /api/v1/policies/:id/toggle
   */
  togglePolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const policy = await this.policyService.togglePolicy(req.params.id);

      res.status(200).json({
        success: true,
        message: `Policy ${policy.isActive ? 'enabled' : 'disabled'} successfully`,
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // USER SCOPE MANAGEMENT
  // ==========================================

  /**
   * Assign scope to user
   * POST /api/v1/users/:userId/scopes
   */
  assignScope = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validationResult = createUserScopeSchema.safeParse({
        ...req.body,
        userId: req.params.userId,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const scope = await this.policyService.assignScope(
        req.user.userId,
        validationResult.data
      );

      res.status(201).json({
        success: true,
        message: 'Geographic scope assigned successfully',
        data: scope,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List user scopes
   * GET /api/v1/users/:userId/scopes
   */
  getUserScopes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const scopes = await this.policyService.getUserScopes(req.params.userId);

      res.status(200).json({
        success: true,
        message: 'User scopes retrieved successfully',
        data: scopes,
        count: scopes.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove user scope
   * DELETE /api/v1/scopes/:scopeId
   */
  removeScope = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.policyService.removeScope(req.params.scopeId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // PERMISSION MANAGEMENT
  // ==========================================

  /**
   * Grant permission to user
   * POST /api/v1/users/:userId/permissions
   */
  grantPermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validationResult = grantPermissionSchema.safeParse({
        ...req.body,
        userId: req.params.userId,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const permission = await this.policyService.grantPermission(
        req.user.userId,
        validationResult.data
      );

      res.status(201).json({
        success: true,
        message: 'Permission granted successfully',
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List user permissions
   * GET /api/v1/users/:userId/permissions
   */
  getUserPermissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const includeExpired = req.query.includeExpired === 'true';

      const permissions = await this.policyService.getUserPermissions(
        req.params.userId,
        includeExpired
      );

      res.status(200).json({
        success: true,
        message: 'User permissions retrieved successfully',
        data: permissions,
        count: permissions.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Revoke permission
   * DELETE /api/v1/permissions/:permissionId
   */
  revokePermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.policyService.revokePermission(
        req.params.permissionId
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // AUDIT & ANALYTICS
  // ==========================================

  /**
   * Get permission audit trail
   * GET /api/v1/permissions/audit
   */
  getAuditTrail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = auditTrailFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError('Invalid filter parameters');
      }

      const checks = await this.policyService.getAuditTrail(
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Audit trail retrieved successfully',
        data: checks,
        count: checks.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user permission statistics
   * GET /api/v1/users/:userId/permissions/stats
   */
  getUserStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;

      const stats = await this.policyService.getPermissionStats(
        req.params.userId,
        days
      );

      res.status(200).json({
        success: true,
        message: 'Permission statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get system-wide permission statistics
   * GET /api/v1/permissions/stats
   */
  getSystemStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;

      const stats = await this.policyService.getSystemStats(days);

      res.status(200).json({
        success: true,
        message: 'System statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Revoke expired permissions (maintenance endpoint)
   * POST /api/v1/permissions/cleanup
   */
  cleanupExpiredPermissions = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.policyService.revokeExpiredPermissions();

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get users by geographic scope
   * GET /api/v1/scopes/users
   */
  getUsersByScope = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = {
        countyId: req.query.countyId as string,
        constituencyId: req.query.constituencyId as string,
        wardId: req.query.wardId as string,
      };

      const users = await this.policyService.getUsersByScope(filters);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default PolicyController;
