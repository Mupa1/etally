/**
 * Election Service
 * Business logic for election management with ABAC integration
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import RedisService from '@/infrastructure/cache/redis.service';
import authorizationMiddleware from '@/infrastructure/middleware/authorization.middleware';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '@/shared/types/errors';
import { ElectionStatus, ElectionType, UserRole } from '@prisma/client';

interface ICreateElectionData {
  electionCode: string;
  title: string;
  electionType: ElectionType;
  electionDate: Date;
  description?: string;
}

interface IUpdateElectionData {
  title?: string;
  electionDate?: Date;
  description?: string;
  status?: ElectionStatus;
}

interface IElectionFilters {
  status?: ElectionStatus | ElectionStatus[];
  electionType?: ElectionType;
  startDate?: Date;
  endDate?: Date;
  countyId?: string;
  constituencyId?: string;
}

class ElectionService {
  private prisma: PrismaService;
  private redis: RedisService;

  constructor() {
    this.prisma = PrismaService.getInstance();
    this.redis = RedisService.getInstance();
  }

  /**
   * Create a new election
   * ABAC: Checks creation permission and geographic scope
   */
  async createElection(
    userId: string,
    role: UserRole,
    data: ICreateElectionData
  ) {
    // Verify user has permission to create elections
    const canCreate = await authorizationMiddleware.canUser(
      userId,
      role,
      'election',
      'create'
    );

    if (!canCreate) {
      throw new AuthorizationError('Not authorized to create elections');
    }

    // Check if election code already exists
    const existing = await this.prisma.election.findUnique({
      where: { electionCode: data.electionCode },
    });

    if (existing) {
      throw new ValidationError(
        `Election with code ${data.electionCode} already exists`
      );
    }

    // Create election
    const election = await this.prisma.election.create({
      data: {
        ...data,
        createdBy: userId,
        status: 'draft',
      },
      include: {
        contests: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Invalidate election list cache
    await this.redis.invalidatePattern('elections:*');

    return election;
  }

  /**
   * List elections with ABAC-based filtering
   * Automatically filters by user's geographic scope
   */
  async listElections(
    userId: string,
    role: UserRole,
    filters: IElectionFilters = {}
  ) {
    // Get user's geographic scopes
    const userScopes = await this.getUserScopes(userId);

    // Build where clause with ABAC filtering
    const where: any = {
      deletedAt: null,
    };

    // Apply status filter
    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    } else {
      // Public viewers only see active/completed elections
      if (role === 'public_viewer') {
        where.status = { in: ['active', 'completed'] };
      }
    }

    // Apply election type filter
    if (filters.electionType) {
      where.electionType = filters.electionType;
    }

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      where.electionDate = {};
      if (filters.startDate) {
        where.electionDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.electionDate.lte = filters.endDate;
      }
    }

    // Apply geographic scope filtering (unless national scope)
    if (
      role !== 'super_admin' &&
      role !== 'election_manager' &&
      userScopes.length > 0
    ) {
      const scopeConditions = this.buildGeographicScopeFilter(
        userScopes,
        filters
      );
      if (scopeConditions.length > 0) {
        where.OR = scopeConditions;
      }
    }

    // Check cache
    const cacheKey = `elections:list:${userId}:${JSON.stringify(where)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const elections = await this.prisma.election.findMany({
      where,
      include: {
        contests: {
          include: {
            candidates: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { electionDate: 'desc' },
    });

    // Cache for 5 minutes
    await this.redis.set(cacheKey, elections, 300);

    return elections;
  }

  /**
   * Get election by ID
   * ABAC: Verifies read permission and geographic scope
   */
  async getElectionById(userId: string, role: UserRole, electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId, deletedAt: null },
      include: {
        contests: {
          include: {
            candidates: {
              include: {
                party: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!election) {
      throw new NotFoundError('Election', electionId);
    }

    // ABAC check with resource attributes
    const canRead = await authorizationMiddleware.canUser(
      userId,
      role,
      'election',
      'read',
      electionId,
      {
        electionStatus: election.status,
        createdBy: election.createdBy,
      }
    );

    if (!canRead) {
      throw new AuthorizationError('Not authorized to view this election');
    }

    return election;
  }

  /**
   * Update election
   * ABAC: Checks update permission, ownership, and geographic scope
   */
  async updateElection(
    userId: string,
    role: UserRole,
    electionId: string,
    data: IUpdateElectionData
  ) {
    // Fetch existing election
    const election = await this.prisma.election.findUnique({
      where: { id: electionId, deletedAt: null },
    });

    if (!election) {
      throw new NotFoundError('Election', electionId);
    }

    // ABAC check with resource attributes
    const canUpdate = await authorizationMiddleware.canUser(
      userId,
      role,
      'election',
      'update',
      electionId,
      {
        ownerId: election.createdBy,
        electionStatus: election.status,
      }
    );

    if (!canUpdate) {
      throw new AuthorizationError('Not authorized to update this election');
    }

    // Cannot update completed or cancelled elections
    if (['completed', 'cancelled'].includes(election.status)) {
      throw new ValidationError(
        'Cannot update completed or cancelled elections'
      );
    }

    // Update election
    const updated = await this.prisma.election.update({
      where: { id: electionId },
      data,
      include: {
        contests: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Invalidate caches
    await this.redis.del(`election:${electionId}`);
    await this.redis.invalidatePattern('elections:*');

    return updated;
  }

  /**
   * Delete election (soft delete)
   * ABAC: Only creator or super admin can delete
   */
  async deleteElection(userId: string, role: UserRole, electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId, deletedAt: null },
    });

    if (!election) {
      throw new NotFoundError('Election', electionId);
    }

    // ABAC check with ownership
    const canDelete = await authorizationMiddleware.canUser(
      userId,
      role,
      'election',
      'delete',
      electionId,
      {
        ownerId: election.createdBy,
        electionStatus: election.status,
      }
    );

    if (!canDelete) {
      throw new AuthorizationError('Not authorized to delete this election');
    }

    // Can only delete draft elections
    if (election.status !== 'draft') {
      throw new ValidationError('Can only delete draft elections');
    }

    // Soft delete
    const deleted = await this.prisma.election.update({
      where: { id: electionId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // Invalidate caches
    await this.redis.del(`election:${electionId}`);
    await this.redis.invalidatePattern('elections:*');

    return deleted;
  }

  /**
   * Approve election (change status from draft to scheduled)
   * ABAC: Only managers can approve
   */
  async approveElection(userId: string, role: UserRole, electionId: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId, deletedAt: null },
    });

    if (!election) {
      throw new NotFoundError('Election', electionId);
    }

    // ABAC check
    const canApprove = await authorizationMiddleware.canUser(
      userId,
      role,
      'election',
      'approve',
      electionId,
      {
        electionStatus: election.status,
      }
    );

    if (!canApprove) {
      throw new AuthorizationError('Not authorized to approve elections');
    }

    // Can only approve draft elections
    if (election.status !== 'draft') {
      throw new ValidationError('Can only approve draft elections');
    }

    // Update to scheduled
    const approved = await this.prisma.election.update({
      where: { id: electionId },
      data: {
        status: 'scheduled',
      },
      include: {
        contests: true,
      },
    });

    // Invalidate caches
    await this.redis.del(`election:${electionId}`);
    await this.redis.invalidatePattern('elections:*');

    return approved;
  }

  /**
   * Get user's geographic scopes
   * Private helper method
   */
  private async getUserScopes(userId: string) {
    const cacheKey = `user:${userId}:scopes`;
    let scopes = await this.redis.get<any[]>(cacheKey);

    if (!scopes) {
      scopes = await this.prisma.userGeographicScope.findMany({
        where: { userId },
        include: {
          county: true,
          constituency: true,
          ward: true,
        },
      });

      await this.redis.set(cacheKey, scopes, 300); // 5 minutes
    }

    return scopes;
  }

  /**
   * Build geographic scope filter for queries
   * Private helper method
   */
  private buildGeographicScopeFilter(scopes: any[], filters: IElectionFilters) {
    const conditions: any[] = [];

    // If user has explicit filter, use it if within their scope
    if (filters.countyId || filters.constituencyId) {
      const hasAccess = scopes.some((scope) => {
        if (filters.countyId && scope.countyId === filters.countyId)
          return true;
        if (
          filters.constituencyId &&
          scope.constituencyId === filters.constituencyId
        )
          return true;
        return false;
      });

      if (hasAccess) {
        const condition: any = {};
        if (filters.countyId) condition.countyId = filters.countyId;
        if (filters.constituencyId)
          condition.constituencyId = filters.constituencyId;
        return [condition];
      }
    }

    // Otherwise, build OR conditions for all user scopes
    for (const scope of scopes) {
      if (scope.scopeLevel === 'national') {
        return []; // No filtering needed
      }

      const condition: any = {};

      if (scope.scopeLevel === 'county' && scope.countyId) {
        condition.countyId = scope.countyId;
      } else if (scope.scopeLevel === 'constituency' && scope.constituencyId) {
        condition.constituencyId = scope.constituencyId;
      } else if (scope.scopeLevel === 'ward' && scope.wardId) {
        condition.wardId = scope.wardId;
      }

      if (Object.keys(condition).length > 0) {
        conditions.push(condition);
      }
    }

    return conditions;
  }

  /**
   * Get election statistics
   * ABAC: Filtered by user's geographic scope
   */
  async getElectionStats(userId: string, role: UserRole) {
    const userScopes = await this.getUserScopes(userId);

    // Build scope filter
    const where: any = { deletedAt: null };
    if (
      role !== 'super_admin' &&
      role !== 'election_manager' &&
      userScopes.length > 0
    ) {
      const scopeConditions = this.buildGeographicScopeFilter(userScopes, {});
      if (scopeConditions.length > 0) {
        where.OR = scopeConditions;
      }
    }

    // Get counts by status
    const stats = await this.prisma.election.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Get total elections
    const total = await this.prisma.election.count({ where });

    return {
      total,
      byStatus: stats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}

export default ElectionService;

