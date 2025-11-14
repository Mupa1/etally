/**
 * Coalition Service
 * Business logic for managing party coalitions
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import { NotFoundError, ValidationError } from '@/shared/types/errors';

interface ICreateCoalitionData {
  name: string;
  abbreviation?: string;
  description?: string;
  isCompetitor?: boolean;
  logoUrl?: string;
  isActive?: boolean;
}

interface IUpdateCoalitionData {
  name?: string;
  abbreviation?: string | null;
  description?: string | null;
  isCompetitor?: boolean;
  logoUrl?: string | null;
  isActive?: boolean;
}

class CoalitionService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  /**
   * Create a new coalition
   */
  async createCoalition(data: ICreateCoalitionData) {
    // Check if coalition with same name exists
    const existing = await this.prisma.coalition.findFirst({
      where: { 
        name: { equals: data.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ValidationError(
        `Coalition with name "${data.name}" already exists`
      );
    }

    const coalition = await this.prisma.coalition.create({
      data: {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isCompetitor: data.isCompetitor || false,
      },
      include: {
        parties: {
          include: {
            party: true,
          },
        },
      },
    });

    return coalition;
  }

  /**
   * Get all coalitions with optional filters
   */
  async getCoalitions(filters?: { isActive?: boolean; isCompetitor?: boolean }) {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isCompetitor !== undefined) {
      where.isCompetitor = filters.isCompetitor;
    }

    const coalitions = await this.prisma.coalition.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      include: {
        parties: {
          include: {
            party: {
              select: {
                id: true,
                partyName: true,
                abbreviation: true,
                logoUrl: true,
                primaryColor: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return coalitions;
  }

  /**
   * Get coalition by ID
   */
  async getCoalitionById(id: string) {
    const coalition = await this.prisma.coalition.findUnique({
      where: { id },
      include: {
        parties: {
          include: {
            party: {
              select: {
                id: true,
                partyName: true,
                abbreviation: true,
                logoUrl: true,
                primaryColor: true,
                isActive: true,
                certificateNumber: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });

    if (!coalition || coalition.deletedAt) {
      throw new NotFoundError('Coalition', id);
    }

    return coalition;
  }

  /**
   * Update coalition
   */
  async updateCoalition(id: string, data: IUpdateCoalitionData) {
    const existing = await this.prisma.coalition.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Coalition', id);
    }

    const coalition = await this.prisma.coalition.update({
      where: { id },
      data,
      include: {
        parties: {
          include: {
            party: {
              select: {
                id: true,
                partyName: true,
                abbreviation: true,
                logoUrl: true,
                primaryColor: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return coalition;
  }

  /**
   * Delete coalition (soft delete)
   */
  async deleteCoalition(id: string) {
    const existing = await this.prisma.coalition.findUnique({
      where: { id },
      include: {
        parties: true,
      },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Coalition', id);
    }

    await this.prisma.coalition.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return { message: 'Coalition deleted successfully' };
  }

  /**
   * Add parties to coalition
   */
  async addPartiesToCoalition(coalitionId: string, partyIds: string[]) {
    const coalition = await this.prisma.coalition.findUnique({
      where: { id: coalitionId },
    });

    if (!coalition || coalition.deletedAt) {
      throw new NotFoundError('Coalition', coalitionId);
    }

    // Verify all parties exist
    const parties = await this.prisma.politicalParty.findMany({
      where: {
        id: { in: partyIds },
        deletedAt: null,
      },
    });

    if (parties.length !== partyIds.length) {
      throw new ValidationError('One or more parties not found');
    }

    // Add parties to coalition (skip if already exists due to unique constraint)
    const results = await Promise.allSettled(
      partyIds.map((partyId) =>
        this.prisma.partyCoalition.create({
          data: {
            coalitionId,
            partyId,
          },
        })
      )
    );

    const added = results.filter((r) => r.status === 'fulfilled').length;
    const skipped = results.filter(
      (r) => r.status === 'rejected' && (r.reason as any).code === 'P2002'
    ).length;

    return {
      added,
      skipped,
      total: partyIds.length,
    };
  }

  /**
   * Remove parties from coalition
   */
  async removePartiesFromCoalition(coalitionId: string, partyIds: string[]) {
    const coalition = await this.prisma.coalition.findUnique({
      where: { id: coalitionId },
    });

    if (!coalition || coalition.deletedAt) {
      throw new NotFoundError('Coalition', coalitionId);
    }

    await this.prisma.partyCoalition.deleteMany({
      where: {
        coalitionId,
        partyId: { in: partyIds },
      },
    });

    return { message: 'Parties removed from coalition successfully' };
  }

  /**
   * Get coalition statistics
   */
  async getCoalitionStatistics() {
    const [total, active, competitor, friendly] = await Promise.all([
      this.prisma.coalition.count({ where: { deletedAt: null } }),
      this.prisma.coalition.count({
        where: { deletedAt: null, isActive: true },
      }),
      this.prisma.coalition.count({
        where: { deletedAt: null, isCompetitor: true },
      }),
      this.prisma.coalition.count({
        where: { deletedAt: null, isCompetitor: false },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      competitor,
      friendly,
    };
  }
}

export default CoalitionService;

