/**
 * Geographic Service
 * Business logic for geographic data management including bulk upload
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import RedisService from '@/infrastructure/cache/redis.service';
import { ValidationError, DatabaseError } from '@/shared/types/errors';
import {
  INormalizedCSVRow,
  IBulkUploadChunk,
  IBulkUploadSummary,
  IGeographicFilters,
  IStatisticsFilters,
  IVotingAreaStatistics,
  IPollingStationSearchFilters,
  IHierarchyFilters,
  IHierarchyItem,
} from './geographic.types';

class GeographicService {
  private prisma: PrismaService;
  private redis: RedisService;

  constructor() {
    this.prisma = PrismaService.getInstance();
    this.redis = RedisService.getInstance();
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
   * Get basic geographic statistics (legacy method for backward compatibility)
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

  /**
   * Get comprehensive voting area statistics with aggregation
   * Optimized for big data with efficient database queries and caching
   */
  async getVotingAreaStatistics(
    filters: IStatisticsFilters = {}
  ): Promise<IVotingAreaStatistics> {
    // Generate cache key based on filters
    const cacheKey = `voting_stats:${JSON.stringify(filters)}`;

    // Try to get from cache first (5 minute cache)
    const cached = await this.redis.get<IVotingAreaStatistics>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Build base where conditions
      const baseWhere = { deletedAt: null };
      const pollingStationWhere = {
        ...baseWhere,
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      };

      // Get total counts efficiently
      const [
        totalCounties,
        totalConstituencies,
        totalWards,
        totalPollingStations,
        totalRegisteredVoters,
      ] = await Promise.all([
        this.prisma.county.count({ where: baseWhere }),
        this.prisma.constituency.count({ where: baseWhere }),
        this.prisma.electoralWard.count({ where: baseWhere }),
        this.prisma.pollingStation.count({ where: pollingStationWhere }),
        this.prisma.pollingStation.aggregate({
          where: pollingStationWhere,
          _sum: { registeredVoters: true },
        }),
      ]);

      // Build query for counties with nested data
      const countyWhere = filters.countyId
        ? { ...baseWhere, id: filters.countyId }
        : baseWhere;

      const counties = await this.prisma.county.findMany({
        where: countyWhere,
        include: {
          constituencies: {
            where: { deletedAt: null },
            include: {
              wards: {
                where: { deletedAt: null },
                include: {
                  pollingStations: {
                    where: pollingStationWhere,
                    select: { registeredVoters: true },
                  },
                  _count: {
                    select: {
                      pollingStations: {
                        where: pollingStationWhere,
                      },
                    },
                  },
                },
              },
              _count: {
                select: {
                  wards: { where: { deletedAt: null } },
                },
              },
            },
          },
          _count: {
            select: {
              constituencies: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Process county-level data
      const countyStats = counties.map((county: any) => {
        let totalWards = 0;
        let totalPollingStations = 0;
        let totalVoters = 0;

        county.constituencies.forEach((constituency: any) => {
          totalWards += constituency.wards.length;

          constituency.wards.forEach((ward: any) => {
            totalPollingStations += ward._count.pollingStations;
            totalVoters += ward.pollingStations.reduce(
              (sum: number, ps: any) => sum + ps.registeredVoters,
              0
            );
          });
        });

        return {
          id: county.id,
          code: county.code,
          name: county.name,
          totalConstituencies: county._count.constituencies,
          totalWards,
          totalPollingStations,
          totalRegisteredVoters: totalVoters,
        };
      });

      const result: IVotingAreaStatistics = {
        totalCounties,
        totalConstituencies,
        totalWards,
        totalPollingStations,
        totalRegisteredVoters: totalRegisteredVoters._sum.registeredVoters || 0,
        counties: countyStats,
      };

      // Get constituency-level statistics if countyId is specified
      if (filters.countyId) {
        const constituencies = await this.prisma.constituency.findMany({
          where: {
            ...baseWhere,
            countyId: filters.countyId,
            ...(filters.constituencyId && { id: filters.constituencyId }),
          },
          include: {
            county: { select: { name: true } },
            wards: {
              where: { deletedAt: null },
              include: {
                pollingStations: {
                  where: pollingStationWhere,
                  select: { registeredVoters: true },
                },
                _count: {
                  select: {
                    pollingStations: {
                      where: pollingStationWhere,
                    },
                  },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        result.constituencies = constituencies.map((constituency) => {
          let totalPollingStations = 0;
          let totalVoters = 0;

          constituency.wards.forEach((ward) => {
            totalPollingStations += ward._count.pollingStations;
            totalVoters += ward.pollingStations.reduce(
              (sum, ps) => sum + ps.registeredVoters,
              0
            );
          });

          return {
            id: constituency.id,
            code: constituency.code,
            name: constituency.name,
            countyId: constituency.countyId,
            countyName: constituency.county.name,
            totalWards: constituency.wards.length,
            totalPollingStations,
            totalRegisteredVoters: totalVoters,
          };
        });

        // Get ward-level statistics if constituencyId is specified
        if (filters.constituencyId) {
          const wards = await this.prisma.electoralWard.findMany({
            where: {
              ...baseWhere,
              constituencyId: filters.constituencyId,
              ...(filters.wardId && { id: filters.wardId }),
            },
            include: {
              constituency: { select: { name: true } },
              pollingStations: {
                where: pollingStationWhere,
                select: { registeredVoters: true },
              },
              _count: {
                select: {
                  pollingStations: {
                    where: pollingStationWhere,
                  },
                },
              },
            },
            orderBy: { name: 'asc' },
          });

          result.wards = wards.map((ward) => ({
            id: ward.id,
            code: ward.code,
            name: ward.name,
            constituencyId: ward.constituencyId,
            constituencyName: ward.constituency.name,
            totalPollingStations: ward._count.pollingStations,
            totalRegisteredVoters: ward.pollingStations.reduce(
              (sum, ps) => sum + ps.registeredVoters,
              0
            ),
          }));

          // Get polling station-level statistics if wardId is specified
          if (filters.wardId) {
            const pollingStations = await this.prisma.pollingStation.findMany({
              where: {
                ...pollingStationWhere,
                wardId: filters.wardId,
              },
              include: {
                ward: { select: { name: true } },
              },
              orderBy: { name: 'asc' },
            });

            result.pollingStations = pollingStations.map((ps) => ({
              id: ps.id,
              code: ps.code,
              name: ps.name,
              wardId: ps.wardId,
              wardName: ps.ward.name,
              registeredVoters: ps.registeredVoters,
            }));
          }
        }
      }

      // Cache the result for 5 minutes
      await this.redis.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      throw new DatabaseError(
        'Failed to fetch voting area statistics',
        error as Error
      );
    }
  }

  /**
   * Search and filter all polling stations with full hierarchy information
   * Optimized for big data with pagination, search, and filtering
   */
  async searchPollingStations(filters: IPollingStationSearchFilters = {}) {
    try {
      // Build where conditions
      const where: any = {
        deletedAt: null,
      };

      // Filter by active status
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      // Filter by ward
      if (filters.wardId) {
        where.wardId = filters.wardId;
      }

      // Filter by constituency (through ward)
      if (filters.constituencyId && !filters.wardId) {
        where.ward = {
          constituencyId: filters.constituencyId,
          deletedAt: null,
        };
      }

      // Filter by county (through ward and constituency)
      if (filters.countyId && !filters.constituencyId && !filters.wardId) {
        where.ward = {
          constituency: {
            countyId: filters.countyId,
            deletedAt: null,
          },
          deletedAt: null,
        };
      }

      // Search by name or code
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
          {
            ward: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
          {
            ward: {
              constituency: {
                name: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
          {
            ward: {
              constituency: {
                county: {
                  name: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
          },
        ];
      }

      // Calculate pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Build sort order
      const orderBy: any = {};
      const sortBy = filters.sortBy || 'name';
      const sortOrder = filters.sortOrder || 'asc';
      orderBy[sortBy] = sortOrder;

      // Execute query with pagination
      const [pollingStations, totalCount] = await Promise.all([
        this.prisma.pollingStation.findMany({
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
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.pollingStation.count({ where }),
      ]);

      // Format response with full hierarchy
      const formattedData = pollingStations.map((ps) => ({
        id: ps.id,
        code: ps.code,
        name: ps.name,
        registeredVoters: ps.registeredVoters,
        isActive: ps.isActive,
        latitude: ps.latitude,
        longitude: ps.longitude,
        ward: {
          id: ps.ward.id,
          code: ps.ward.code,
          name: ps.ward.name,
        },
        constituency: {
          id: ps.ward.constituency.id,
          code: ps.ward.constituency.code,
          name: ps.ward.constituency.name,
        },
        county: {
          id: ps.ward.constituency.county.id,
          code: ps.ward.constituency.county.code,
          name: ps.ward.constituency.county.name,
        },
      }));

      return {
        data: formattedData,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new DatabaseError(
        'Failed to search polling stations',
        error as Error
      );
    }
  }

  /**
   * Get hierarchical data with drill-down support
   * Returns counties, constituencies, wards, or polling stations based on level
   * Includes aggregated statistics at each level
   */
  async getHierarchyData(filters: IHierarchyFilters) {
    try {
      const {
        level,
        countyId,
        constituencyId,
        wardId,
        search,
        isActive,
        page = 1,
        limit = 100,
      } = filters;
      const skip = (page - 1) * limit;

      switch (level) {
        case 'county': {
          // Return all counties with aggregated stats
          const where: any = { deletedAt: null };

          if (search) {
            where.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ];
          }

          const [counties, totalCount] = await Promise.all([
            this.prisma.county.findMany({
              where,
              include: {
                constituencies: {
                  where: { deletedAt: null },
                  include: {
                    wards: {
                      where: { deletedAt: null },
                      include: {
                        pollingStations: {
                          where:
                            isActive !== undefined
                              ? { isActive, deletedAt: null }
                              : { deletedAt: null },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: { name: 'asc' },
              skip,
              take: limit,
            }),
            this.prisma.county.count({ where }),
          ]);

          const items: IHierarchyItem[] = counties.map((county: any) => {
            let totalWards = 0;
            let totalPollingStations = 0;
            let totalVoters = 0;

            county.constituencies.forEach((constituency: any) => {
              totalWards += constituency.wards.length;
              constituency.wards.forEach((ward: any) => {
                totalPollingStations += ward.pollingStations.length;
                totalVoters += ward.pollingStations.reduce(
                  (sum: number, ps: any) => sum + ps.registeredVoters,
                  0
                );
              });
            });

            return {
              id: county.id,
              code: county.code,
              name: county.name,
              type: 'county',
              totalConstituencies: county.constituencies.length,
              totalWards,
              totalPollingStations,
              totalRegisteredVoters: totalVoters,
            };
          });

          return {
            data: items,
            pagination: {
              page,
              limit,
              totalCount,
              totalPages: Math.ceil(totalCount / limit),
            },
          };
        }

        case 'constituency': {
          // Return constituencies in a county (or all if no county specified)
          const where: any = { deletedAt: null };

          if (countyId) {
            where.countyId = countyId;
          }

          if (search) {
            where.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ];
          }

          const [constituencies, totalCount] = await Promise.all([
            this.prisma.constituency.findMany({
              where,
              include: {
                county: true,
                wards: {
                  where: { deletedAt: null },
                  include: {
                    pollingStations: {
                      where:
                        isActive !== undefined
                          ? { isActive, deletedAt: null }
                          : { deletedAt: null },
                    },
                  },
                },
              },
              orderBy: { name: 'asc' },
              skip,
              take: limit,
            }),
            this.prisma.constituency.count({ where }),
          ]);

          const items: IHierarchyItem[] = constituencies.map(
            (constituency: any) => {
              let totalPollingStations = 0;
              let totalVoters = 0;

              constituency.wards.forEach((ward: any) => {
                totalPollingStations += ward.pollingStations.length;
                totalVoters += ward.pollingStations.reduce(
                  (sum: number, ps: any) => sum + ps.registeredVoters,
                  0
                );
              });

              return {
                id: constituency.id,
                code: constituency.code,
                name: constituency.name,
                type: 'constituency',
                countyId: constituency.countyId,
                countyName: constituency.county.name,
                totalWards: constituency.wards.length,
                totalPollingStations,
                totalRegisteredVoters: totalVoters,
              };
            }
          );

          return {
            data: items,
            pagination: {
              page,
              limit,
              totalCount,
              totalPages: Math.ceil(totalCount / limit),
            },
          };
        }

        case 'ward': {
          // Return wards in a constituency (or all if no constituency specified)
          const where: any = { deletedAt: null };

          if (constituencyId) {
            where.constituencyId = constituencyId;
          }

          if (search) {
            where.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ];
          }

          const [wards, totalCount] = await Promise.all([
            this.prisma.electoralWard.findMany({
              where,
              include: {
                constituency: {
                  include: {
                    county: true,
                  },
                },
                pollingStations: {
                  where:
                    isActive !== undefined
                      ? { isActive, deletedAt: null }
                      : { deletedAt: null },
                },
              },
              orderBy: { name: 'asc' },
              skip,
              take: limit,
            }),
            this.prisma.electoralWard.count({ where }),
          ]);

          const items: IHierarchyItem[] = wards.map((ward: any) => ({
            id: ward.id,
            code: ward.code,
            name: ward.name,
            type: 'ward',
            countyId: ward.constituency.county.id,
            countyName: ward.constituency.county.name,
            constituencyId: ward.constituencyId,
            constituencyName: ward.constituency.name,
            totalPollingStations: ward.pollingStations.length,
            totalRegisteredVoters: ward.pollingStations.reduce(
              (sum: number, ps: any) => sum + ps.registeredVoters,
              0
            ),
          }));

          return {
            data: items,
            pagination: {
              page,
              limit,
              totalCount,
              totalPages: Math.ceil(totalCount / limit),
            },
          };
        }

        case 'polling_station': {
          // Return polling stations in a ward (or all if no ward specified)
          const where: any = { deletedAt: null };

          if (wardId) {
            where.wardId = wardId;
          }

          if (isActive !== undefined) {
            where.isActive = isActive;
          }

          if (search) {
            where.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ];
          }

          const [pollingStations, totalCount] = await Promise.all([
            this.prisma.pollingStation.findMany({
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
              skip,
              take: limit,
            }),
            this.prisma.pollingStation.count({ where }),
          ]);

          const items: IHierarchyItem[] = pollingStations.map((ps: any) => ({
            id: ps.id,
            code: ps.code,
            name: ps.name,
            type: 'polling_station',
            countyId: ps.ward.constituency.county.id,
            countyName: ps.ward.constituency.county.name,
            constituencyId: ps.ward.constituency.id,
            constituencyName: ps.ward.constituency.name,
            wardId: ps.wardId,
            wardName: ps.ward.name,
            registeredVoters: ps.registeredVoters,
            totalRegisteredVoters: ps.registeredVoters,
            isActive: ps.isActive,
            latitude: ps.latitude,
            longitude: ps.longitude,
          }));

          return {
            data: items,
            pagination: {
              page,
              limit,
              totalCount,
              totalPages: Math.ceil(totalCount / limit),
            },
          };
        }

        default:
          throw new ValidationError('Invalid hierarchy level');
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch hierarchy data', error as Error);
    }
  }
}

export default GeographicService;
