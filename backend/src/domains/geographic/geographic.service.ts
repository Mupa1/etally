/**
 * Geographic Service
 * Business logic for geographic data management including bulk upload
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import { ValidationError, DatabaseError } from '@/shared/types/errors';
import {
  INormalizedCSVRow,
  IBulkUploadChunk,
  IBulkUploadSummary,
  IGeographicFilters,
} from './geographic.types';

class GeographicService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  /**
   * Process bulk upload of geographic data
   * Creates/updates counties, constituencies, wards, and polling stations
   */
  async bulkUpload(
    chunk: IBulkUploadChunk
  ): Promise<{ summary: IBulkUploadSummary }> {
    const summary: IBulkUploadSummary = {
      countiesAdded: 0,
      countiesUpdated: 0,
      constituenciesAdded: 0,
      constituenciesUpdated: 0,
      wardsAdded: 0,
      wardsUpdated: 0,
      pollingStationsAdded: 0,
      pollingStationsUpdated: 0,
    };

    try {
      // Process in transaction for consistency
      await this.prisma.$transaction(async (tx) => {
        // Group data by hierarchy to minimize database queries
        const countyMap = new Map<string, INormalizedCSVRow>();
        const constituencyMap = new Map<string, INormalizedCSVRow>();
        const wardMap = new Map<string, INormalizedCSVRow>();

        // Build maps to avoid duplicates
        for (const row of chunk.data) {
          const countyKey = `${row.countyCode}-${row.countyName}`;
          countyMap.set(countyKey, row);

          const constituencyKey = `${row.countyCode}-${row.constituencyCode}-${row.constituencyName}`;
          constituencyMap.set(constituencyKey, row);

          const wardKey = `${row.countyCode}-${row.constituencyCode}-${row.wardCode}-${row.wardName}`;
          wardMap.set(wardKey, row);
        }

        // Process Counties
        for (const [, row] of Array.from(countyMap.entries())) {
          const existingCounty = await tx.county.findUnique({
            where: { code: row.countyCode },
          });

          if (existingCounty) {
            if (existingCounty.name !== row.countyName) {
              await tx.county.update({
                where: { id: existingCounty.id },
                data: { name: row.countyName },
              });
              summary.countiesUpdated++;
            }
          } else {
            await tx.county.create({
              data: {
                code: row.countyCode,
                name: row.countyName,
              },
            });
            summary.countiesAdded++;
          }
        }

        // Process Constituencies
        for (const [, row] of Array.from(constituencyMap.entries())) {
          // Get county ID
          const county = await tx.county.findUnique({
            where: { code: row.countyCode },
          });

          if (!county) {
            throw new ValidationError(
              `County with code ${row.countyCode} not found`
            );
          }

          const existingConstituency = await tx.constituency.findUnique({
            where: { code: row.constituencyCode },
          });

          if (existingConstituency) {
            if (
              existingConstituency.name !== row.constituencyName ||
              existingConstituency.countyId !== county.id
            ) {
              await tx.constituency.update({
                where: { id: existingConstituency.id },
                data: {
                  name: row.constituencyName,
                  countyId: county.id,
                },
              });
              summary.constituenciesUpdated++;
            }
          } else {
            await tx.constituency.create({
              data: {
                code: row.constituencyCode,
                name: row.constituencyName,
                countyId: county.id,
              },
            });
            summary.constituenciesAdded++;
          }
        }

        // Process Wards
        for (const [, row] of Array.from(wardMap.entries())) {
          // Get constituency ID
          const constituency = await tx.constituency.findUnique({
            where: { code: row.constituencyCode },
          });

          if (!constituency) {
            throw new ValidationError(
              `Constituency with code ${row.constituencyCode} not found`
            );
          }

          const existingWard = await tx.electoralWard.findUnique({
            where: { code: row.wardCode },
          });

          if (existingWard) {
            if (
              existingWard.name !== row.wardName ||
              existingWard.constituencyId !== constituency.id
            ) {
              await tx.electoralWard.update({
                where: { id: existingWard.id },
                data: {
                  name: row.wardName,
                  constituencyId: constituency.id,
                },
              });
              summary.wardsUpdated++;
            }
          } else {
            await tx.electoralWard.create({
              data: {
                code: row.wardCode,
                name: row.wardName,
                constituencyId: constituency.id,
              },
            });
            summary.wardsAdded++;
          }
        }

        // Process Polling Stations
        for (const row of chunk.data) {
          // Get ward ID
          const ward = await tx.electoralWard.findUnique({
            where: { code: row.wardCode },
          });

          if (!ward) {
            throw new ValidationError(
              `Ward with code ${row.wardCode} not found`
            );
          }

          const existingPollingStation = await tx.pollingStation.findUnique({
            where: { code: row.pollingStationCode },
          });

          if (existingPollingStation) {
            if (
              existingPollingStation.name !== row.pollingStationName ||
              existingPollingStation.wardId !== ward.id ||
              existingPollingStation.registeredVoters !== row.registeredVoters
            ) {
              await tx.pollingStation.update({
                where: { id: existingPollingStation.id },
                data: {
                  name: row.pollingStationName,
                  wardId: ward.id,
                  registeredVoters: row.registeredVoters,
                },
              });
              summary.pollingStationsUpdated++;
            }
          } else {
            await tx.pollingStation.create({
              data: {
                code: row.pollingStationCode,
                name: row.pollingStationName,
                wardId: ward.id,
                registeredVoters: row.registeredVoters,
                isActive: true,
              },
            });
            summary.pollingStationsAdded++;
          }
        }
      });

      return { summary };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to process bulk upload', error as Error);
    }
  }

  /**
   * Get all counties
   */
  async getCounties(filters: IGeographicFilters = {}) {
    const counties = await this.prisma.county.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        constituencies: {
          where: { deletedAt: null },
          include: {
            wards: {
              where: { deletedAt: null },
              include: {
                pollingStations: {
                  where:
                    filters.isActive !== undefined
                      ? { isActive: filters.isActive }
                      : {},
                },
              },
            },
          },
        },
        _count: {
          select: {
            constituencies: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return counties;
  }

  /**
   * Get all constituencies
   */
  async getConstituencies(filters: IGeographicFilters = {}) {
    const where: any = {
      deletedAt: null,
    };

    if (filters.countyId) {
      where.countyId = filters.countyId;
    }

    const constituencies = await this.prisma.constituency.findMany({
      where,
      include: {
        county: true,
        wards: {
          where: { deletedAt: null },
          include: {
            pollingStations: {
              where:
                filters.isActive !== undefined
                  ? { isActive: filters.isActive }
                  : {},
            },
          },
        },
        _count: {
          select: {
            wards: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return constituencies;
  }

  /**
   * Get all wards
   */
  async getWards(filters: IGeographicFilters = {}) {
    const where: any = {
      deletedAt: null,
    };

    if (filters.constituencyId) {
      where.constituencyId = filters.constituencyId;
    }

    const wards = await this.prisma.electoralWard.findMany({
      where,
      include: {
        constituency: {
          include: {
            county: true,
          },
        },
        pollingStations: {
          where:
            filters.isActive !== undefined
              ? { isActive: filters.isActive }
              : {},
        },
        _count: {
          select: {
            pollingStations: {
              where:
                filters.isActive !== undefined
                  ? { isActive: filters.isActive }
                  : {},
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return wards;
  }

  /**
   * Get all polling stations
   */
  async getPollingStations(filters: IGeographicFilters = {}) {
    const where: any = {
      deletedAt: null,
    };

    if (filters.wardId) {
      where.wardId = filters.wardId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const pollingStations = await this.prisma.pollingStation.findMany({
      where,
      include: {
        ward: {
          include: {
            constituency: {
              include: {
                county: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return pollingStations;
  }

  /**
   * Get geographic statistics
   */
  async getStatistics() {
    const [counties, constituencies, wards, pollingStations] =
      await Promise.all([
        this.prisma.county.count({
          where: { deletedAt: null },
        }),
        this.prisma.constituency.count({
          where: { deletedAt: null },
        }),
        this.prisma.electoralWard.count({
          where: { deletedAt: null },
        }),
        this.prisma.pollingStation.count({
          where: { deletedAt: null },
        }),
      ]);

    return {
      counties,
      constituencies,
      wards,
      pollingStations,
    };
  }
}

export default GeographicService;
