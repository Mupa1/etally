/**
 * ABAC Service
 * Attribute-Based Access Control - Core authorization engine
 * Evaluates permissions based on user attributes, resource attributes, and context
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import RedisService from '@/infrastructure/cache/redis.service';
import { UserRole, PermissionAction, ResourceType } from '@prisma/client';
import {
  IAccessContext,
  IPolicyEvaluationResult,
  IPolicyConditions,
  IGeographicScope,
} from '@/shared/interfaces/abac.interface';

class ABACService {
  private prisma: PrismaService;
  private redis: RedisService;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor() {
    this.prisma = PrismaService.getInstance();
    this.redis = RedisService.getInstance();
  }

  /**
   * Main authorization check - evaluates all policies
   * This is the primary entry point for permission checks
   */
  async checkAccess(context: IAccessContext): Promise<IPolicyEvaluationResult> {
    const startTime = Date.now();

    try {
      // 1. Check explicit user permissions first (highest priority)
      const userPermission = await this.checkUserPermission(context);
      if (userPermission !== null) {
        return this.logAndReturn(
          context,
          userPermission,
          'user_permission_override',
          startTime
        );
      }

      // 2. Check RBAC - base role permissions
      const rbacResult = await this.checkRBAC(context);
      if (!rbacResult.granted) {
        return this.logAndReturn(
          context,
          false,
          rbacResult.reason || 'rbac_denied',
          startTime
        );
      }

      // 3. Check geographic scope restrictions
      const geoResult = await this.checkGeographicScope(context);
      if (!geoResult.granted) {
        return this.logAndReturn(
          context,
          false,
          geoResult.reason || 'geo_scope_denied',
          startTime
        );
      }

      // 4. Check resource ownership
      const ownershipResult = await this.checkOwnership(context);
      if (!ownershipResult.granted) {
        return this.logAndReturn(
          context,
          false,
          ownershipResult.reason || 'ownership_denied',
          startTime
        );
      }

      // 5. Evaluate dynamic policies
      const policyResult = await this.evaluatePolicies(context);
      if (!policyResult.granted) {
        return this.logAndReturn(
          context,
          false,
          policyResult.reason || 'policy_denied',
          startTime
        );
      }

      // 6. Check time-based restrictions
      const timeResult = await this.checkTimeRestrictions(context);
      if (!timeResult.granted) {
        return this.logAndReturn(
          context,
          false,
          timeResult.reason || 'time_restricted',
          startTime
        );
      }

      // All checks passed
      return this.logAndReturn(context, true, 'access_granted', startTime);
    } catch (error) {
      console.error('ABAC check error:', error);
      return this.logAndReturn(context, false, 'evaluation_error', startTime);
    }
  }

  /**
   * Check explicit user permissions (overrides)
   * Returns: true (allow), false (deny), or null (not applicable)
   */
  private async checkUserPermission(
    context: IAccessContext
  ): Promise<boolean | null> {
    const cacheKey = `permission:${context.userId}:${context.resourceType}:${context.resourceId}:${context.action}`;

    // Try cache first
    const cached = await this.redis.get<boolean | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Query database
    const permission = await this.prisma.userPermission.findFirst({
      where: {
        userId: context.userId,
        resourceType: context.resourceType,
        action: context.action,
        AND: [
          {
            OR: [
              { resourceId: context.resourceId },
              { resourceId: null }, // Wildcard permission
            ],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!permission) return null;

    const result = permission.effect === 'allow';

    // Cache the result
    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * RBAC - Role-based permissions
   * Defines what each role can do with each resource type
   */
  private async checkRBAC(
    context: IAccessContext
  ): Promise<IPolicyEvaluationResult> {
    const { role, resourceType, action } = context;

    // Super admin has full access to everything
    if (role === 'super_admin') {
      return {
        granted: true,
        appliedPolicies: ['super_admin_full_access'],
      };
    }

    // Define role-based permissions matrix
    const permissions: Record<
      UserRole,
      Partial<Record<ResourceType, PermissionAction[]>>
    > = {
      super_admin: {}, // Full access handled above

      election_manager: {
        election: ['create', 'read', 'update', 'delete', 'approve'],
        election_contest: ['create', 'read', 'update', 'delete'],
        candidate: ['create', 'read', 'update', 'delete'],
        election_result: [
          'create',
          'read',
          'update',
          'verify',
          'approve',
          'export',
        ],
        incident: ['read', 'update', 'verify'],
        user: ['read', 'update'],
        polling_station: ['read', 'update'],
        audit_log: ['read', 'export'],
      },

      field_observer: {
        election: ['read'],
        election_contest: ['read'],
        candidate: ['read'],
        election_result: ['create', 'read', 'submit'],
        incident: ['create', 'read'],
        polling_station: ['read'],
        audit_log: [],
        user: [],
      },

      public_viewer: {
        election: ['read'],
        election_contest: ['read'],
        candidate: ['read'],
        election_result: ['read'], // Only verified/confirmed results via policy
        incident: [],
        polling_station: [],
        audit_log: [],
        user: [],
      },
    };

    const allowedActions = permissions[role]?.[resourceType] || [];
    const granted = allowedActions.includes(action);

    return {
      granted,
      reason: granted
        ? undefined
        : `Role ${role} not allowed action ${action} on ${resourceType}`,
      appliedPolicies: [`rbac_${role}`],
    };
  }

  /**
   * Check geographic scope restrictions
   * Ensures users can only access resources within their assigned geographic areas
   */
  private async checkGeographicScope(
    context: IAccessContext
  ): Promise<IPolicyEvaluationResult> {
    const { userId, role, resourceAttributes } = context;

    // Super admins and election managers have national scope by default
    if (role === 'super_admin' || role === 'election_manager') {
      return { granted: true, appliedPolicies: ['national_scope'] };
    }

    // Try cache first
    const cacheKey = `geo_scopes:${userId}`;
    let userScopes = await this.redis.get<IGeographicScope[]>(cacheKey);

    if (!userScopes) {
      // Fetch from database
      const scopes = await this.prisma.userGeographicScope.findMany({
        where: { userId },
        include: {
          county: true,
          constituency: true,
          ward: true,
        },
      });

      userScopes = scopes.map((s) => ({
        scopeLevel: s.scopeLevel as any,
        countyId: s.countyId || undefined,
        constituencyId: s.constituencyId || undefined,
        wardId: s.wardId || undefined,
      }));

      // Cache for 5 minutes
      await this.redis.set(cacheKey, userScopes, this.CACHE_TTL);
    }

    // If no scopes defined, deny access (except for public viewers on read)
    if (userScopes.length === 0) {
      if (role === 'public_viewer' && context.action === 'read') {
        return { granted: true, appliedPolicies: ['public_read'] };
      }
      return {
        granted: false,
        reason: 'No geographic scope assigned to user',
        appliedPolicies: [],
      };
    }

    // Check if resource is within user's scope
    const resourceAttrs = resourceAttributes || {};

    for (const scope of userScopes) {
      // National scope - access to everything
      if (scope.scopeLevel === 'national') {
        return { granted: true, appliedPolicies: ['national_scope'] };
      }

      // County scope
      if (scope.scopeLevel === 'county' && scope.countyId) {
        if (resourceAttrs.countyId === scope.countyId) {
          return {
            granted: true,
            appliedPolicies: [`county_scope:${scope.countyId}`],
          };
        }
      }

      // Constituency scope
      if (scope.scopeLevel === 'constituency' && scope.constituencyId) {
        if (resourceAttrs.constituencyId === scope.constituencyId) {
          return {
            granted: true,
            appliedPolicies: [`constituency_scope:${scope.constituencyId}`],
          };
        }
      }

      // Ward scope
      if (scope.scopeLevel === 'ward' && scope.wardId) {
        if (resourceAttrs.wardId === scope.wardId) {
          return {
            granted: true,
            appliedPolicies: [`ward_scope:${scope.wardId}`],
          };
        }
      }
    }

    return {
      granted: false,
      reason: 'Resource outside user geographic scope',
      appliedPolicies: [],
    };
  }

  /**
   * Check resource ownership
   * Ensures users can only modify their own resources (for certain actions)
   */
  private async checkOwnership(
    context: IAccessContext
  ): Promise<IPolicyEvaluationResult> {
    const { userId, resourceAttributes, action, role } = context;

    // Ownership only matters for certain actions
    const ownershipRelevantActions: PermissionAction[] = [
      'update',
      'delete',
      'verify',
      'approve',
    ];
    if (!ownershipRelevantActions.includes(action)) {
      return {
        granted: true,
        appliedPolicies: ['ownership_not_applicable'],
      };
    }

    // If no resource attributes provided, we can't check ownership
    if (!resourceAttributes) {
      return { granted: true, appliedPolicies: ['no_resource_attributes'] };
    }

    // Determine resource owner
    const ownerId =
      resourceAttributes.ownerId ||
      resourceAttributes.createdBy ||
      resourceAttributes.submittedBy;

    if (!ownerId) {
      // No ownership info - allow managers, deny others
      if (role === 'election_manager' || role === 'super_admin') {
        return { granted: true, appliedPolicies: ['manager_override'] };
      }
      return {
        granted: false,
        reason: 'Cannot determine resource ownership',
        appliedPolicies: [],
      };
    }

    // User owns the resource
    if (ownerId === userId) {
      return { granted: true, appliedPolicies: ['resource_owner'] };
    }

    // For field observers, they can only modify their own submissions
    if (role === 'field_observer') {
      return {
        granted: false,
        reason: 'Can only modify your own submissions',
        appliedPolicies: ['field_observer_ownership_required'],
      };
    }

    // Managers and admins can modify others' submissions
    if (role === 'election_manager' || role === 'super_admin') {
      return { granted: true, appliedPolicies: ['manager_override'] };
    }

    return {
      granted: false,
      reason: 'Ownership check failed',
      appliedPolicies: [],
    };
  }

  /**
   * Evaluate dynamic access policies
   * Checks database-defined policies with complex conditions
   */
  private async evaluatePolicies(
    context: IAccessContext
  ): Promise<IPolicyEvaluationResult> {
    // Try cache first
    const cacheKey = `policies:${context.resourceType}:${context.action}:${context.role}`;
    let policies = await this.redis.get<any[]>(cacheKey);

    if (!policies) {
      // Fetch active policies from database
      policies = await this.prisma.accessPolicy.findMany({
        where: {
          isActive: true,
          resourceType: context.resourceType,
          actions: { has: context.action },
          roles: { has: context.role },
        },
        orderBy: { priority: 'desc' },
      });

      // Cache for 5 minutes
      await this.redis.set(cacheKey, policies, this.CACHE_TTL);
    }

    // Evaluate each policy (highest priority first)
    for (const policy of policies) {
      const conditionsMet = await this.evaluateConditions(
        policy.conditions as IPolicyConditions,
        context
      );

      if (conditionsMet) {
        // If conditions are met and it's a deny policy, deny access
        if (policy.effect === 'deny') {
          return {
            granted: false,
            reason: `Denied by policy: ${policy.name}`,
            appliedPolicies: [policy.name],
          };
        }
        // If allow policy with met conditions, continue to next checks
      }
    }

    // No deny policies matched
    return { granted: true, appliedPolicies: [] };
  }

  /**
   * Evaluate policy conditions
   * Checks if contextual conditions match the policy requirements
   */
  private async evaluateConditions(
    conditions: IPolicyConditions | null,
    context: IAccessContext
  ): Promise<boolean> {
    if (!conditions) return true;

    // Time range check
    if (conditions.timeRange) {
      const now = context.timestamp || new Date();
      const start = new Date(conditions.timeRange.start);
      const end = new Date(conditions.timeRange.end);
      if (now < start || now > end) return false;
    }

    // IP whitelist check
    if (conditions.ipWhitelist && context.ipAddress) {
      if (!conditions.ipWhitelist.includes(context.ipAddress)) return false;
    }

    // IP blacklist check
    if (conditions.ipBlacklist && context.ipAddress) {
      if (conditions.ipBlacklist.includes(context.ipAddress)) return false;
    }

    // IP range check (legacy)
    if (conditions.ipRange && context.ipAddress) {
      if (!conditions.ipRange.includes(context.ipAddress)) return false;
    }

    // Device type check
    if (conditions.deviceTypes && context.deviceId) {
      // Implementation depends on device type tracking
      // For now, pass through
    }

    // Device ID whitelist
    if (conditions.deviceIds && context.deviceId) {
      if (!conditions.deviceIds.includes(context.deviceId)) return false;
    }

    // Location-based check (geofencing)
    if (
      conditions.geofence &&
      context.latitude !== undefined &&
      context.longitude !== undefined
    ) {
      const withinGeofence = this.checkGeofence(
        context.latitude,
        context.longitude,
        conditions.geofence
      );
      if (!withinGeofence) return false;
    }

    // Election status check
    if (
      conditions.electionStatus &&
      context.resourceAttributes?.electionStatus
    ) {
      if (
        !conditions.electionStatus.includes(
          context.resourceAttributes.electionStatus
        )
      ) {
        return false;
      }
    }

    // Result status check
    if (conditions.resultStatus && context.resourceAttributes?.resultStatus) {
      if (
        !conditions.resultStatus.includes(
          context.resourceAttributes.resultStatus
        )
      ) {
        return false;
      }
    }

    // Requires active election
    if (conditions.requiresActiveElection) {
      if (context.resourceAttributes?.electionStatus !== 'active') {
        return false;
      }
    }

    // Requires verified result
    if (conditions.requiresVerifiedResult) {
      const status = context.resourceAttributes?.resultStatus;
      if (status !== 'verified' && status !== 'confirmed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Check time-based restrictions
   * Business logic for time-sensitive operations
   */
  private async checkTimeRestrictions(
    context: IAccessContext
  ): Promise<IPolicyEvaluationResult> {
    // Field observers can only submit results during active elections
    if (
      context.role === 'field_observer' &&
      (context.action === 'submit' || context.action === 'create') &&
      context.resourceType === 'election_result'
    ) {
      if (context.resourceAttributes?.electionStatus !== 'active') {
        return {
          granted: false,
          reason: 'Can only submit results during active elections',
          appliedPolicies: ['election_active_required'],
        };
      }
    }

    // Public viewers can only read verified/confirmed results
    if (
      context.role === 'public_viewer' &&
      context.action === 'read' &&
      context.resourceType === 'election_result'
    ) {
      const status = context.resourceAttributes?.resultStatus;
      if (status !== 'verified' && status !== 'confirmed') {
        return {
          granted: false,
          reason: 'Public viewers can only view verified results',
          appliedPolicies: ['verified_results_only'],
        };
      }
    }

    return { granted: true, appliedPolicies: [] };
  }

  /**
   * Check if point is within geofence
   */
  private checkGeofence(
    lat: number,
    lng: number,
    geofence: IPolicyConditions['geofence']
  ): boolean {
    if (!geofence) return true;

    // Circle geofence
    if (geofence.type === 'circle' && geofence.center && geofence.radius) {
      const distance = this.calculateDistance(
        lat,
        lng,
        geofence.center.lat,
        geofence.center.lng
      );
      return distance <= geofence.radius;
    }

    // Polygon geofence
    if (geofence.type === 'polygon' && geofence.polygon) {
      return this.isPointInPolygon(lat, lng, geofence.polygon);
    }

    return true;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if point is inside polygon using ray-casting algorithm
   */
  private isPointInPolygon(
    lat: number,
    lng: number,
    polygon: Array<{ lat: number; lng: number }>
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      const intersect =
        yi > lat !== yj > lat &&
        lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Log permission check and return result
   * Async logging - doesn't block the request
   */
  private async logAndReturn(
    context: IAccessContext,
    granted: boolean,
    reason: string,
    startTime: number
  ): Promise<IPolicyEvaluationResult> {
    const evaluationTimeMs = Date.now() - startTime;

    // Log to database (async, non-blocking)
    this.prisma.permissionCheck
      .create({
        data: {
          userId: context.userId,
          resourceType: context.resourceType,
          resourceId: context.resourceId,
          action: context.action,
          granted,
          reason: granted ? undefined : reason,
          ipAddress: context.ipAddress,
          deviceId: context.deviceId,
          latitude: context.latitude,
          longitude: context.longitude,
        },
      })
      .catch((err) =>
        console.error('Failed to log permission check:', err.message)
      );

    return {
      granted,
      reason: granted ? undefined : reason,
      appliedPolicies: [reason],
      evaluationTimeMs,
    };
  }

  /**
   * Bulk check - check multiple permissions at once
   * Useful for checking permissions on lists of resources
   */
  async checkBulkAccess(
    contexts: IAccessContext[]
  ): Promise<IPolicyEvaluationResult[]> {
    return Promise.all(contexts.map((ctx) => this.checkAccess(ctx)));
  }

  /**
   * Invalidate permission cache for a user
   * Call this when user's permissions or scopes change
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.redis.invalidatePattern(`permission:${userId}:*`);
    await this.redis.del(`geo_scopes:${userId}`);
  }

  /**
   * Invalidate policy cache
   * Call this when policies are created/updated/deleted
   */
  async invalidatePolicyCache(): Promise<void> {
    await this.redis.invalidatePattern('policies:*');
  }

  /**
   * Get permission statistics for a user
   * Useful for debugging and monitoring
   */
  async getUserPermissionStats(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const checks = await this.prisma.permissionCheck.findMany({
      where: {
        userId,
        checkedAt: { gte: startDate },
      },
      select: {
        action: true,
        resourceType: true,
        granted: true,
        reason: true,
      },
    });

    const total = checks.length;
    const granted = checks.filter((c) => c.granted).length;
    const denied = total - granted;

    const byResourceType = checks.reduce(
      (acc, check) => {
        const key = check.resourceType;
        if (!acc[key]) {
          acc[key] = { total: 0, granted: 0, denied: 0 };
        }
        acc[key].total++;
        if (check.granted) {
          acc[key].granted++;
        } else {
          acc[key].denied++;
        }
        return acc;
      },
      {} as Record<string, { total: number; granted: number; denied: number }>
    );

    const denialReasons = checks
      .filter((c) => !c.granted && c.reason)
      .reduce(
        (acc, check) => {
          const reason = check.reason!;
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    return {
      period: { days, startDate, endDate: new Date() },
      summary: { total, granted, denied, successRate: (granted / total) * 100 },
      byResourceType,
      denialReasons,
    };
  }
}

export default ABACService;
