/**
 * Election Service
 * Business logic for election management with ABAC integration
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import RedisService from '@/infrastructure/cache/redis.service';
import authorizationMiddleware from '@/infrastructure/middleware/authorization.middleware';
import PartyService from '@/domains/parties/party.service';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '@/shared/types/errors';
import {
  ElectionScopeLevel,
  ElectionStatus,
  ElectionType,
  ReferendumQuestionType,
  UserRole,
} from '@prisma/client';

interface IContestInput {
  positionName: string;
  description?: string | null;
  orderIndex?: number | null;
}

interface IReferendumQuestionInput {
  questionText: string;
  questionType?: ReferendumQuestionType;
  orderIndex?: number | null;
}

interface ICreateElectionData {
  electionCode: string;
  title: string;
  electionType: ElectionType;
  electionDate: Date;
  description?: string | null;
  parentElectionId?: string | null;
  nominationOpenDate?: Date | null;
  nominationCloseDate?: Date | null;
  partyListDeadline?: Date | null;
  observerCallDate?: Date | null;
  observerAppDeadline?: Date | null;
  observerReviewDeadline?: Date | null;
  tallyingStartDate?: Date | null;
  tallyingEndDate?: Date | null;
  resultsPublishDate?: Date | null;
  scopeLevel?: ElectionScopeLevel | null;
  countyId?: string | null;
  constituencyId?: string | null;
  wardId?: string | null;
  contests?: IContestInput[];
  referendumQuestions?: IReferendumQuestionInput[];
}

interface IUpdateElectionData {
  title?: string;
  electionDate?: Date;
  description?: string | null;
  status?: ElectionStatus;
  electionType?: ElectionType;
  parentElectionId?: string | null;
  nominationOpenDate?: Date | null;
  nominationCloseDate?: Date | null;
  partyListDeadline?: Date | null;
  observerCallDate?: Date | null;
  observerAppDeadline?: Date | null;
  observerReviewDeadline?: Date | null;
  tallyingStartDate?: Date | null;
  tallyingEndDate?: Date | null;
  resultsPublishDate?: Date | null;
  scopeLevel?: ElectionScopeLevel | null;
  countyId?: string | null;
  constituencyId?: string | null;
  wardId?: string | null;
  contests?: IContestInput[];
  referendumQuestions?: IReferendumQuestionInput[];
}

interface IElectionFilters {
  status?: ElectionStatus | ElectionStatus[];
  electionType?: ElectionType;
  startDate?: Date;
  endDate?: Date;
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
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

    const {
      contests,
      referendumQuestions,
      countyId,
      constituencyId,
      wardId,
      scopeLevel,
      parentElectionId,
      nominationOpenDate,
      nominationCloseDate,
      partyListDeadline,
      observerCallDate,
      observerAppDeadline,
      observerReviewDeadline,
      tallyingStartDate,
      tallyingEndDate,
      resultsPublishDate,
      ...baseData
    } = data;

    // Create election
    const election = await this.prisma.election.create({
      data: {
        ...baseData,
        parentElectionId: parentElectionId ?? null,
        nominationOpenDate: nominationOpenDate ?? null,
        nominationCloseDate: nominationCloseDate ?? null,
        partyListDeadline: partyListDeadline ?? null,
        observerCallDate: observerCallDate ?? null,
        observerAppDeadline: observerAppDeadline ?? null,
        observerReviewDeadline: observerReviewDeadline ?? null,
        tallyingStartDate: tallyingStartDate ?? null,
        tallyingEndDate: tallyingEndDate ?? null,
        resultsPublishDate: resultsPublishDate ?? null,
        scopeLevel: scopeLevel ?? null,
        countyId: countyId ?? null,
        constituencyId: constituencyId ?? null,
        wardId: wardId ?? null,
        createdBy: userId,
        status: 'draft',
        contests:
          contests && contests.length > 0
            ? {
                create: contests.map((contest, index) => ({
                  positionName: contest.positionName,
                  description: contest.description || null,
                  orderIndex: contest.orderIndex ?? index,
                })),
              }
            : undefined,
        referendumQuestions:
          referendumQuestions && referendumQuestions.length > 0
            ? {
                create: referendumQuestions.map((question, index) => ({
                  questionText: question.questionText,
                  questionType: question.questionType || ReferendumQuestionType.yes_no,
                  orderIndex: question.orderIndex ?? index,
                })),
              }
            : undefined,
      },
      include: this.baseElectionInclude(),
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
    // Get user's geographic scopes only if needed
    let userScopes: any[] = [];
    if (role !== 'super_admin' && role !== 'election_manager') {
      userScopes = await this.getUserScopes(userId);
    }

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

    if (filters.countyId) {
      where.countyId = filters.countyId;
    }
    if (filters.constituencyId) {
      where.constituencyId = filters.constituencyId;
    }
    if (filters.wardId) {
      where.wardId = filters.wardId;
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
      include: this.baseElectionInclude(true),
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
      include: this.baseElectionInclude(true),
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

    const {
      contests,
      referendumQuestions,
      countyId,
      constituencyId,
      wardId,
      scopeLevel,
      parentElectionId,
      ...updateData
    } = data;

    const payload: any = {
      ...updateData,
    };

    if (parentElectionId !== undefined) {
      payload.parentElectionId = parentElectionId ?? null;
    }
    if (scopeLevel !== undefined) {
      payload.scopeLevel = scopeLevel ?? null;
    }
    if (countyId !== undefined) {
      payload.countyId = countyId ?? null;
    }
    if (constituencyId !== undefined) {
      payload.constituencyId = constituencyId ?? null;
    }
    if (wardId !== undefined) {
      payload.wardId = wardId ?? null;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.election.update({
        where: { id: electionId },
        data: payload,
      });

      if (Array.isArray(contests)) {
        await tx.electionContest.deleteMany({ where: { electionId } });
        if (contests.length > 0) {
          await tx.electionContest.createMany({
            data: contests.map((contest, index) => ({
              electionId,
              positionName: contest.positionName,
              description: contest.description || null,
              orderIndex: contest.orderIndex ?? index,
            })),
          });
        }
      }

      if (Array.isArray(referendumQuestions)) {
        await tx.electionReferendumQuestion.deleteMany({
          where: { electionId },
        });
        if (referendumQuestions.length > 0) {
          await tx.electionReferendumQuestion.createMany({
            data: referendumQuestions.map((question, index) => ({
              electionId,
              questionText: question.questionText,
              questionType:
                question.questionType || ReferendumQuestionType.yes_no,
              orderIndex: question.orderIndex ?? index,
            })),
          });
        }
      }

      return tx.election.findUniqueOrThrow({
        where: { id: electionId },
        include: this.baseElectionInclude(true),
      });
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
      include: this.baseElectionInclude(),
    });

    // Invalidate caches
    await this.redis.del(`election:${electionId}`);
    await this.redis.invalidatePattern('elections:*');

    return approved;
  }

  private baseElectionInclude(includeCandidates = false) {
    return {
      contests: includeCandidates
        ? {
            include: {
              candidates: {
                include: {
                  party: {
                    include: {
                      coalitions: {
                        include: {
                          coalition: {
                            select: {
                              id: true,
                              name: true,
                              abbreviation: true,
                              isCompetitor: true,
                              isActive: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }
        : true,
      referendumQuestions: true,
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      county: {
        select: {
          id: true,
          name: true,
        },
      },
      constituency: {
        select: {
          id: true,
          name: true,
          county: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      ward: {
        select: {
          id: true,
          name: true,
          constituency: {
            select: {
              id: true,
              name: true,
              county: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      parentElection: {
        select: {
          id: true,
          title: true,
          electionCode: true,
          electionDate: true,
        },
      },
    } as const;
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
    if (filters.countyId || filters.constituencyId || filters.wardId) {
      const hasAccess = scopes.some((scope) => {
        if (filters.countyId && scope.countyId === filters.countyId)
          return true;
        if (
          filters.constituencyId &&
          scope.constituencyId === filters.constituencyId
        )
          return true;
        if (filters.wardId && scope.wardId === filters.wardId) return true;
        return false;
      });

      if (hasAccess) {
        const condition: any = {};
        if (filters.countyId) condition.countyId = filters.countyId;
        if (filters.constituencyId)
          condition.constituencyId = filters.constituencyId;
        if (filters.wardId) condition.wardId = filters.wardId;
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
    let userScopes: any[] = [];
    if (role !== 'super_admin' && role !== 'election_manager') {
      userScopes = await this.getUserScopes(userId);
    }

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

  /**
   * Upload contestants from CSV data
   * ABAC: Checks update permission and election ownership
   */
  async uploadContestants(
    userId: string,
    role: UserRole,
    electionId: string,
    contestId: string,
    records: any[]
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    // Verify election exists and user can update it
    const election = await this.prisma.election.findUnique({
      where: { id: electionId, deletedAt: null },
    });

    if (!election) {
      throw new NotFoundError('Election', electionId);
    }

    // ABAC check
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
        'Cannot update contestants for completed or cancelled elections'
      );
    }

    // Verify contest exists and belongs to this election
    const contest = await this.prisma.electionContest.findFirst({
      where: {
        id: contestId,
        electionId: electionId,
        deletedAt: null,
      },
    });

    if (!contest) {
      throw new NotFoundError('Contest', contestId);
    }

    // Initialize PartyService
    const partyService = new PartyService();

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because header is row 1 and 0-indexed

      try {
        // Validate required fields
        if (!record.SNo || !record.Surname || !record.OtherNames) {
          errors.push(
            `Row ${rowNumber}: Missing required fields (SNo, Surname, OtherNames)`
          );
          failed++;
          continue;
        }

        const fullName = `${record.OtherNames.trim()} ${record.Surname.trim()}`.trim();

        // Find or create party
        let partyId: string | null = null;

        if (record.PartyCode || record.PartyAbbreviation || record.PartyName) {
          try {
            // Try to find party by abbreviation first
            let party = null;
            if (record.PartyAbbreviation) {
              const parties = await partyService.getParties({
                abbreviation: record.PartyAbbreviation.trim(),
              });
              if (parties.length > 0) {
                party = parties[0];
              }
            }

            // If not found, try to find by name
            if (!party && record.PartyName) {
              const parties = await partyService.getParties({
                search: record.PartyName.trim(),
              });
              if (parties.length > 0) {
                party = parties[0];
              }
            }

            // Create party if not found
            if (!party) {
              // Use PartyCode or generate a certificate number
              const certificateNumber =
                record.PartyCode?.trim() ||
                `TEMP-${record.PartyAbbreviation?.trim() || Date.now()}`;

              party = await partyService.createParty({
                certificateNumber,
                partyName: record.PartyName?.trim() || 'Unknown Party',
                abbreviation: record.PartyAbbreviation?.trim() || undefined,
              });
            }

            partyId = party.id;
          } catch (partyError: any) {
            errors.push(
              `Row ${rowNumber}: Failed to find/create party - ${partyError.message}`
            );
            failed++;
            continue;
          }
        }

        // Create candidate
        const candidateNumber = parseInt(record.SNo) || null;

        await this.prisma.candidate.create({
          data: {
            contestId: contestId,
            fullName: fullName,
            partyId: partyId,
            candidateNumber: candidateNumber,
            isIndependent: !partyId,
          },
        });

        successful++;
      } catch (error: any) {
        errors.push(
          `Row ${rowNumber}: ${error.message || 'Failed to create candidate'}`
        );
        failed++;
      }
    }

    // Invalidate caches
    await this.redis.del(`election:${electionId}`);
    await this.redis.invalidatePattern('elections:*');

    return { successful, failed, errors };
  }

  /**
   * Upload contests and candidates from CSV data for by-elections
   * ABAC: Checks update permission and election ownership
   * 
   * CSV Format:
   * SNo,Surname,OtherNames,CountyCode,County,ConstituencyCode,ConstituencyName,CAWCode,CAWName,PartyCode,PartyName,PartyAbbreviation,ElectionType
   * 
   * Contest Detection Logic:
   * - County only → County-level contest (can be Senatorial, Gubernatorial, or Women's Rep - default to ElectionType)
   * - County + Constituency → National Assembly
   * - County + Constituency + CAW → County Assembly
   */
  async uploadContests(
    userId: string,
    role: UserRole,
    electionId: string,
    records: any[]
  ): Promise<{
    contestsCreated: number;
    candidatesCreated: number;
    contests: any[];
    errors: string[];
  }> {
    // Verify election exists and user can update it
    const election = await this.prisma.election.findUnique({
      where: { id: electionId, deletedAt: null },
    });

    if (!election) {
      throw new NotFoundError('Election', electionId);
    }

    // Only allow for by-elections
    if (election.electionType !== 'by_election') {
      throw new ValidationError(
        'Contest upload is only allowed for by-elections'
      );
    }

    // ABAC check
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
        'Cannot update contests for completed or cancelled elections'
      );
    }

    // Initialize PartyService
    const partyService = new PartyService();

    // Group records by contest
    const contestGroups = new Map<string, any[]>();

    // Helper function to generate contest key
    const getContestKey = (record: any): string => {
      const countyCode = record.CountyCode?.trim() || '';
      const constituencyCode = record.ConstituencyCode?.trim() || '';
      const wardCode = record.CAWCode?.trim() || '';
      const electionType = record.ElectionType?.trim() || '';
      
      // Group by geographic scope and election type
      if (wardCode) {
        return `ward:${countyCode}:${constituencyCode}:${wardCode}:${electionType}`;
      } else if (constituencyCode) {
        return `constituency:${countyCode}:${constituencyCode}:${electionType}`;
      } else {
        return `county:${countyCode}:${electionType}`;
      }
    };

    // Group records by contest
    for (const record of records) {
      const key = getContestKey(record);
      if (!contestGroups.has(key)) {
        contestGroups.set(key, []);
      }
      contestGroups.get(key)!.push(record);
    }

    let contestsCreated = 0;
    let candidatesCreated = 0;
    const errors: string[] = [];
    const createdContests: any[] = [];

    // Get initial contest count for order index calculation
    let currentOrderIndex = await this.prisma.electionContest.count({
      where: { electionId: electionId, deletedAt: null },
    });

    // Process each contest group
    for (const [contestKey, contestRecords] of contestGroups.entries()) {
      try {
        const firstRecord = contestRecords[0];
        const countyCode = firstRecord.CountyCode?.trim();
        const countyName = firstRecord.County?.trim();
        const constituencyCode = firstRecord.ConstituencyCode?.trim();
        const constituencyName = firstRecord.ConstituencyName?.trim();
        const wardCode = firstRecord.CAWCode?.trim();
        const wardName = firstRecord.CAWName?.trim();
        const electionType = firstRecord.ElectionType?.trim() || '';

        // Lookup geographic entities
        let countyId: string | null = null;
        let constituencyId: string | null = null;
        let wardId: string | null = null;

        // Lookup county
        if (countyCode) {
          const county = await this.prisma.county.findUnique({
            where: { code: countyCode, deletedAt: null },
          });

          if (!county) {
            errors.push(
              `County not found: ${countyName} (Code: ${countyCode})`
            );
            continue;
          }
          countyId = county.id;
        }

        // Lookup constituency
        if (constituencyCode && countyId) {
          const constituency = await this.prisma.constituency.findFirst({
            where: {
              code: constituencyCode,
              countyId: countyId,
              deletedAt: null,
            },
          });

          if (!constituency) {
            errors.push(
              `Constituency not found: ${constituencyName} (Code: ${constituencyCode}) in ${countyName}`
            );
            continue;
          }
          constituencyId = constituency.id;
        }

        // Lookup ward
        if (wardCode && constituencyId) {
          const ward = await this.prisma.electoralWard.findFirst({
            where: {
              code: wardCode,
              constituencyId: constituencyId,
              deletedAt: null,
            },
          });

          if (!ward) {
            errors.push(
              `Ward not found: ${wardName} (Code: ${wardCode}) in ${constituencyName}`
            );
            continue;
          }
          wardId = ward.id;
        }

        // Determine contest type and position name based on geographic data
        let contestType: string | null = null;
        let positionName = '';

        if (wardId && constituencyId && countyId) {
          // County Assembly
          contestType = 'county_assembly';
          positionName = `${wardName} Member of County Assembly`;
        } else if (constituencyId && countyId) {
          // National Assembly
          contestType = 'national_assembly';
          positionName = `${constituencyName} Member of Parliament`;
        } else if (countyId) {
          // County-level (Senate, Governor, or Women's Rep)
          // Use ElectionType from CSV to determine specific type
          if (electionType === 'Senate') {
            contestType = 'senatorial';
            positionName = `${countyName} Senator`;
          } else if (electionType === 'Governor') {
            contestType = 'gubernatorial';
            positionName = `${countyName} Governor`;
          } else if (electionType === "Women's Representative") {
            contestType = 'womens_representative';
            positionName = `${countyName} Women's Representative`;
          } else {
            // Default to senatorial if ElectionType not specified
            // Can be updated later via UI
            contestType = 'senatorial';
            positionName = `${countyName} Senator`;
          }
        } else {
          errors.push(
            `Invalid geographic data: County code is required for row with ${firstRecord.Surname}`
          );
          continue;
        }

        // Check if contest already exists (by geographic scope and contest type)
        let contest = await this.prisma.electionContest.findFirst({
          where: {
            electionId: electionId,
            countyId: countyId,
            constituencyId: constituencyId || null,
            wardId: wardId || null,
            contestType: contestType,
            deletedAt: null,
          },
        });

        // Create contest if it doesn't exist
        if (!contest) {
          contest = await this.prisma.electionContest.create({
            data: {
              electionId: electionId,
              positionName: positionName,
              description: positionName, // Use positionName as description without contest type prefix
              contestType: contestType,
              countyId: countyId,
              constituencyId: constituencyId,
              wardId: wardId,
              orderIndex: currentOrderIndex++,
            },
          });

          contestsCreated++;
        }

        // Add contest to list for response (whether new or existing)
        createdContests.push(contest);

        // Process candidates for this contest
        for (let i = 0; i < contestRecords.length; i++) {
          const record = contestRecords[i];
          const rowNumber = i + 2;

          try {
            // Validate required fields
            if (!record.SNo || !record.Surname || !record.OtherNames) {
              errors.push(
                `Row ${rowNumber}: Missing required fields (SNo, Surname, OtherNames)`
              );
              continue;
            }

            const fullName = `${record.OtherNames.trim()} ${record.Surname.trim()}`.trim();

            // Find or create party
            let partyId: string | null = null;

            if (
              record.PartyCode ||
              record.PartyAbbreviation ||
              record.PartyName
            ) {
              try {
                // Skip if it's an independent candidate
                if (
                  record.PartyCode?.trim() === 'IND' ||
                  record.PartyName?.trim() === 'Independent'
                ) {
                  partyId = null;
                } else {
                  // Try to find party by abbreviation first
                  let party = null;
                  if (record.PartyAbbreviation) {
                    const parties = await partyService.getParties({
                      abbreviation: record.PartyAbbreviation.trim(),
                    });
                    if (parties.length > 0) {
                      party = parties[0];
                    }
                  }

                  // If not found, try to find by name
                  if (!party && record.PartyName) {
                    const parties = await partyService.getParties({
                      search: record.PartyName.trim(),
                    });
                    if (parties.length > 0) {
                      party = parties[0];
                    }
                  }

                  // Create party if not found
                  if (!party) {
                    const certificateNumber =
                      record.PartyCode?.trim() ||
                      `TEMP-${record.PartyAbbreviation?.trim() || Date.now()}`;

                    party = await partyService.createParty({
                      certificateNumber,
                      partyName: record.PartyName?.trim() || 'Unknown Party',
                      abbreviation: record.PartyAbbreviation?.trim() || undefined,
                    });
                  }

                  partyId = party.id;
                }
              } catch (partyError: any) {
                errors.push(
                  `Row ${rowNumber}: Failed to find/create party - ${partyError.message}`
                );
                continue;
              }
            }

            // Check if candidate already exists
            const existingCandidate = await this.prisma.candidate.findFirst({
              where: {
                contestId: contest.id,
                fullName: fullName,
                deletedAt: null,
              },
            });

            if (existingCandidate) {
              // Skip if candidate already exists
              continue;
            }

            // Create candidate
            const candidateNumber = parseInt(record.SNo) || null;

            await this.prisma.candidate.create({
              data: {
                contestId: contest.id,
                fullName: fullName,
                partyId: partyId,
                candidateNumber: candidateNumber,
                isIndependent: !partyId || record.PartyCode?.trim() === 'IND',
              },
            });

            candidatesCreated++;
          } catch (error: any) {
            errors.push(
              `Row ${rowNumber}: ${error.message || 'Failed to create candidate'}`
            );
          }
        }
      } catch (error: any) {
        errors.push(
          `Failed to process contest group ${contestKey}: ${error.message}`
        );
      }
    }

    // Invalidate caches
    await this.redis.del(`election:${electionId}`);
    await this.redis.invalidatePattern('elections:*');

    return {
      contestsCreated,
      candidatesCreated,
      contests: createdContests,
      errors,
    };
  }
}

export default ElectionService;

