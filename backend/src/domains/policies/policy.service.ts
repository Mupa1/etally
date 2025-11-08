/**
 * Policy Management Service
 * Business logic for managing ABAC policies, user scopes, and permissions
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import authorizationMiddleware from '@/infrastructure/middleware/authorization.middleware';
import { NotFoundError, ValidationError } from '@/shared/types/errors';
import {
  UserRole,
  ResourceType,
  PermissionAction,
  PolicyEffect,
} from '@prisma/client';
import { IPolicyConditions } from '@/shared/interfaces/abac.interface';

interface ICreatePolicyData {
  name: string;
  description?: string;
  effect: PolicyEffect;
  priority: number;
  roles: UserRole[];
  resourceType: ResourceType;
  actions: PermissionAction[];
  conditions?: IPolicyConditions;
  isActive?: boolean;
}

interface ICreateUserScopeData {
  userId: string;
  scopeLevel: 'national' | 'county' | 'constituency' | 'ward';
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
}

interface IGrantPermissionData {
  userId: string;
  resourceType: ResourceType;
  resourceId?: string;
  action: PermissionAction;
  effect: PolicyEffect;
  expiresAt?: Date;
  reason?: string;
}

class PolicyService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  // ==========================================
  // POLICY MANAGEMENT
  // ==========================================

  /**
   * Create access policy
   * Only super admins can create policies
   */
  async createPolicy(adminUserId: string, data: ICreatePolicyData) {
    // Check for duplicate policy name
    const existing = await this.prisma.accessPolicy.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new ValidationError(
        `Policy with name "${data.name}" already exists`
      );
    }

    // Create policy
    const policy = await this.prisma.accessPolicy.create({
      data: {
        ...data,
        createdBy: adminUserId,
      },
    });

    // Invalidate policy cache
    await authorizationMiddleware.invalidatePolicyCache();

    return policy;
  }

  /**
   * List all policies
   */
  async listPolicies(filters?: {
    isActive?: boolean;
    resourceType?: ResourceType;
    role?: UserRole;
  }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters?.role) {
      where.roles = { has: filters.role };
    }

    const policies = await this.prisma.accessPolicy.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return policies;
  }

  /**
   * Get policy by ID
   */
  async getPolicyById(policyId: string) {
    const policy = await this.prisma.accessPolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundError('Policy', policyId);
    }

    return policy;
  }

  /**
   * Update policy
   */
  async updatePolicy(policyId: string, data: Partial<ICreatePolicyData>) {
    const policy = await this.prisma.accessPolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundError('Policy', policyId);
    }

    const updated = await this.prisma.accessPolicy.update({
      where: { id: policyId },
      data,
    });

    // Invalidate policy cache
    await authorizationMiddleware.invalidatePolicyCache();

    return updated;
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId: string) {
    const policy = await this.prisma.accessPolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundError('Policy', policyId);
    }

    await this.prisma.accessPolicy.delete({
      where: { id: policyId },
    });

    // Invalidate policy cache
    await authorizationMiddleware.invalidatePolicyCache();

    return { message: 'Policy deleted successfully' };
  }

  /**
   * Toggle policy active status
   */
  async togglePolicy(policyId: string) {
    const policy = await this.prisma.accessPolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundError('Policy', policyId);
    }

    const updated = await this.prisma.accessPolicy.update({
      where: { id: policyId },
      data: {
        isActive: !policy.isActive,
      },
    });

    // Invalidate policy cache
    await authorizationMiddleware.invalidatePolicyCache();

    return updated;
  }

  // ==========================================
  // USER SCOPE MANAGEMENT
  // ==========================================

  /**
   * Assign geographic scope to user
   */
  async assignScope(_adminUserId: string, data: ICreateUserScopeData) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundError('User', data.userId);
    }

    // Validate scope level matches provided IDs
    if (data.scopeLevel === 'county' && !data.countyId) {
      throw new ValidationError('County ID required for county scope');
    }
    if (data.scopeLevel === 'constituency' && !data.constituencyId) {
      throw new ValidationError(
        'Constituency ID required for constituency scope'
      );
    }
    if (data.scopeLevel === 'ward' && !data.wardId) {
      throw new ValidationError('Ward ID required for ward scope');
    }

    // Check if scope already exists
    const existing = await this.prisma.userGeographicScope.findFirst({
      where: {
        userId: data.userId,
        countyId: data.countyId || null,
        constituencyId: data.constituencyId || null,
        wardId: data.wardId || null,
      },
    });

    if (existing) {
      throw new ValidationError('User already has this geographic scope');
    }

    // Create scope
    const scope = await this.prisma.userGeographicScope.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        county: true,
        constituency: true,
        ward: true,
      },
    });

    // Invalidate user's cache
    await authorizationMiddleware.invalidateUserCache(data.userId);

    return scope;
  }

  /**
   * List user scopes
   */
  async getUserScopes(userId: string) {
    const scopes = await this.prisma.userGeographicScope.findMany({
      where: { userId },
      include: {
        county: true,
        constituency: true,
        ward: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return scopes;
  }

  /**
   * Remove user scope
   */
  async removeScope(scopeId: string) {
    const scope = await this.prisma.userGeographicScope.findUnique({
      where: { id: scopeId },
    });

    if (!scope) {
      throw new NotFoundError('Scope', scopeId);
    }

    await this.prisma.userGeographicScope.delete({
      where: { id: scopeId },
    });

    // Invalidate user's cache
    await authorizationMiddleware.invalidateUserCache(scope.userId);

    return { message: 'Scope removed successfully' };
  }

  // ==========================================
  // USER PERMISSION MANAGEMENT
  // ==========================================

  /**
   * Grant permission to user
   */
  async grantPermission(grantedBy: string, data: IGrantPermissionData) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundError('User', data.userId);
    }

    // Check if permission already exists
    const existing = await this.prisma.userPermission.findFirst({
      where: {
        userId: data.userId,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        action: data.action,
      },
    });

    if (existing) {
      throw new ValidationError('Permission already granted to this user');
    }

    // Create permission
    const permission = await this.prisma.userPermission.create({
      data: {
        ...data,
        grantedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Invalidate user's cache
    await authorizationMiddleware.invalidateUserCache(data.userId);

    return permission;
  }

  /**
   * List user permissions
   */
  async getUserPermissions(userId: string, includeExpired: boolean = false) {
    const where: any = { userId };

    if (!includeExpired) {
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
    }

    const permissions = await this.prisma.userPermission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return permissions;
  }

  /**
   * Revoke permission
   */
  async revokePermission(permissionId: string) {
    const permission = await this.prisma.userPermission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundError('Permission', permissionId);
    }

    await this.prisma.userPermission.delete({
      where: { id: permissionId },
    });

    // Invalidate user's cache
    await authorizationMiddleware.invalidateUserCache(permission.userId);

    return { message: 'Permission revoked successfully' };
  }

  // ==========================================
  // PERMISSION AUDIT
  // ==========================================

  /**
   * Get permission audit trail
   */
  async getAuditTrail(filters: {
    userId?: string;
    resourceType?: ResourceType;
    action?: PermissionAction;
    granted?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.action) where.action = filters.action;
    if (filters.granted !== undefined) where.granted = filters.granted;

    if (filters.startDate || filters.endDate) {
      where.checkedAt = {};
      if (filters.startDate) where.checkedAt.gte = filters.startDate;
      if (filters.endDate) where.checkedAt.lte = filters.endDate;
    }

    const checks = await this.prisma.permissionCheck.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      take: filters.limit || 100,
    });

    return checks;
  }

  /**
   * Get permission statistics
   */
  async getPermissionStats(userId: string, days: number = 7) {
    const abacService = authorizationMiddleware.getService();
    return await abacService.getUserPermissionStats(userId, days);
  }

  /**
   * Get system-wide permission statistics
   */
  async getSystemStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total checks
    const totalChecks = await this.prisma.permissionCheck.count({
      where: { checkedAt: { gte: startDate } },
    });

    // Granted vs denied
    const grantedChecks = await this.prisma.permissionCheck.count({
      where: { checkedAt: { gte: startDate }, granted: true },
    });

    const deniedChecks = totalChecks - grantedChecks;

    // By resource type
    const byResourceType = await this.prisma.permissionCheck.groupBy({
      by: ['resourceType', 'granted'],
      where: { checkedAt: { gte: startDate } },
      _count: true,
    });

    // Top denial reasons
    const denialReasons = await this.prisma.permissionCheck.groupBy({
      by: ['reason'],
      where: {
        checkedAt: { gte: startDate },
        granted: false,
        reason: { not: null },
      },
      _count: true,
      orderBy: { _count: { reason: 'desc' } },
      take: 10,
    });

    // Most active users
    const activeUsers = await this.prisma.permissionCheck.groupBy({
      by: ['userId'],
      where: { checkedAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    return {
      period: { days, startDate, endDate: new Date() },
      summary: {
        total: totalChecks,
        granted: grantedChecks,
        denied: deniedChecks,
        successRate: totalChecks > 0 ? (grantedChecks / totalChecks) * 100 : 0,
      },
      byResourceType: this.formatResourceTypeStats(byResourceType),
      topDenialReasons: denialReasons.map((r) => ({
        reason: r.reason,
        count: r._count,
      })),
      mostActiveUsers: activeUsers.map((u) => ({
        userId: u.userId,
        checkCount: u._count,
      })),
    };
  }

  /**
   * Format resource type statistics
   */
  private formatResourceTypeStats(data: any[]) {
    const result: Record<
      string,
      { total: number; granted: number; denied: number }
    > = {};

    for (const item of data) {
      const resourceType = item.resourceType;
      if (!result[resourceType]) {
        result[resourceType] = { total: 0, granted: 0, denied: 0 };
      }

      result[resourceType].total += item._count;
      if (item.granted) {
        result[resourceType].granted += item._count;
      } else {
        result[resourceType].denied += item._count;
      }
    }

    return result;
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  /**
   * Assign multiple scopes to user
   */
  async bulkAssignScopes(adminUserId: string, scopes: ICreateUserScopeData[]) {
    const results = [];

    for (const scopeData of scopes) {
      try {
        const scope = await this.assignScope(adminUserId, scopeData);
        results.push({ success: true, data: scope });
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          data: scopeData,
        });
      }
    }

    return results;
  }

  /**
   * Revoke all expired permissions
   */
  async revokeExpiredPermissions() {
    const expired = await this.prisma.userPermission.findMany({
      where: {
        expiresAt: {
          not: null,
          lt: new Date(),
        },
      },
    });

    const userIds = [...new Set(expired.map((p) => p.userId))];

    // Delete expired permissions
    await this.prisma.userPermission.deleteMany({
      where: {
        expiresAt: {
          not: null,
          lt: new Date(),
        },
      },
    });

    // Invalidate affected users' caches
    for (const userId of userIds) {
      await authorizationMiddleware.invalidateUserCache(userId);
    }

    return {
      message: `Revoked ${expired.length} expired permissions`,
      count: expired.length,
      affectedUsers: userIds.length,
    };
  }

  /**
   * Get users by geographic scope
   */
  async getUsersByScope(scopeFilter: {
    countyId?: string;
    constituencyId?: string;
    wardId?: string;
  }) {
    const where: any = {};

    if (scopeFilter.countyId) where.countyId = scopeFilter.countyId;
    if (scopeFilter.constituencyId)
      where.constituencyId = scopeFilter.constituencyId;
    if (scopeFilter.wardId) where.wardId = scopeFilter.wardId;

    const scopes = await this.prisma.userGeographicScope.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
        county: true,
        constituency: true,
        ward: true,
      },
    });

    return scopes;
  }
}

export default PolicyService;
