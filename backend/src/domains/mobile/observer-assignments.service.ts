/**
 * Observer Assignments Service
 * Business logic for managing observer assignments to polling stations
 */

import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/shared/types/errors';

export interface AssignmentFilters {
  observerId?: string;
  pollingStationId?: string;
  electionId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateAssignmentData {
  observerRegistrationId: string;
  pollingStationId: string;
  assignmentNotes?: string;
}

export interface UpdateAssignmentData {
  pollingStationId?: string;
  isActive?: boolean;
  deactivationReason?: string;
}

export class ObserverAssignmentsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all assignments with optional filtering
   */
  async getAssignments(filters: AssignmentFilters = {}) {
    const where: any = {};

    if (filters.observerId) {
      where.observerRegistrationId = filters.observerId;
    }

    if (filters.pollingStationId) {
      where.pollingStationId = filters.pollingStationId;
    }

    if (filters.electionId) {
      // Filter by election through polling station
      where.pollingStation = {
        ward: {
          constituency: {
            county: {
              elections: {
                some: {
                  id: filters.electionId,
                },
              },
            },
          },
        },
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        {
          observerRegistration: {
            firstName: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          observerRegistration: {
            lastName: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          observerRegistration: {
            email: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          observerRegistration: {
            phoneNumber: {
              contains: filters.search,
            },
          },
        },
        {
          pollingStation: {
            name: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const assignments = await this.prisma.observerAssignment.findMany({
      where,
      include: {
        observerRegistration: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        pollingStation: {
          include: {
            ward: {
              include: {
                constituency: {
                  include: {
                    county: {
                      include: {
                        elections: {
                          select: {
                            id: true,
                            title: true,
                            electionCode: true,
                          },
                          take: 1,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        assigner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        assignmentDate: 'desc',
      },
    });

    // Transform the data to match frontend expectations
    return assignments.map((assignment) => ({
      id: assignment.id,
      observer: assignment.observerRegistration.user
        ? {
            id: assignment.observerRegistration.user.id,
            firstName: assignment.observerRegistration.firstName,
            lastName: assignment.observerRegistration.lastName,
            email: assignment.observerRegistration.user.email,
            phoneNumber: assignment.observerRegistration.user.phoneNumber,
          }
        : {
            firstName: assignment.observerRegistration.firstName,
            lastName: assignment.observerRegistration.lastName,
            email: assignment.observerRegistration.email,
            phoneNumber: assignment.observerRegistration.phoneNumber,
          },
      pollingStation: assignment.pollingStation
        ? {
            id: assignment.pollingStation.id,
            name: assignment.pollingStation.name,
            code: assignment.pollingStation.code,
            ward: assignment.pollingStation.ward
              ? {
                  id: assignment.pollingStation.ward.id,
                  name: assignment.pollingStation.ward.name,
                  constituency: assignment.pollingStation.ward.constituency
                    ? {
                        id: assignment.pollingStation.ward.constituency.id,
                        name: assignment.pollingStation.ward.constituency.name,
                        county: assignment.pollingStation.ward.constituency
                          .county
                          ? {
                              id: assignment.pollingStation.ward.constituency
                                .county.id,
                              name:
                                assignment.pollingStation.ward.constituency
                                  .county.name,
                            }
                          : null,
                      }
                    : null,
                }
              : null,
          }
        : null,
      election:
        assignment.pollingStation?.ward?.constituency?.county?.elections?.[0] ||
        null,
      assignmentDate: assignment.assignmentDate,
      status: assignment.isActive ? 'assigned' : 'unassigned',
      assignedBy: assignment.assigner
        ? {
            id: assignment.assigner.id,
            name: `${assignment.assigner.firstName} ${assignment.assigner.lastName}`,
          }
        : null,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(id: string) {
    const assignment = await this.prisma.observerAssignment.findUnique({
      where: { id },
      include: {
        observerRegistration: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        pollingStation: {
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
        },
        assigner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment', id);
    }

    return assignment;
  }

  /**
   * Create new assignment
   */
  async createAssignment(data: CreateAssignmentData, assignedBy: string) {
    // Verify observer registration exists
    const observer = await this.prisma.observerRegistration.findUnique({
      where: { id: data.observerRegistrationId },
    });

    if (!observer) {
      throw new NotFoundError('Observer registration', data.observerRegistrationId);
    }

    // Verify polling station exists
    const pollingStation = await this.prisma.pollingStation.findUnique({
      where: { id: data.pollingStationId },
    });

    if (!pollingStation) {
      throw new NotFoundError('Polling station', data.pollingStationId);
    }

    // Check if assignment already exists
    const existing = await this.prisma.observerAssignment.findFirst({
      where: {
        observerRegistrationId: data.observerRegistrationId,
        pollingStationId: data.pollingStationId,
        isActive: true,
      },
    });

    if (existing) {
      throw new ValidationError(
        'Active assignment already exists for this observer and polling station'
      );
    }

    const assignment = await this.prisma.observerAssignment.create({
      data: {
        observerRegistrationId: data.observerRegistrationId,
        pollingStationId: data.pollingStationId,
        assignedBy,
        isActive: true,
      },
      include: {
        observerRegistration: {
          include: {
            user: true,
          },
        },
        pollingStation: {
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
        },
      },
    });

    return assignment;
  }

  /**
   * Update assignment
   */
  async updateAssignment(
    id: string,
    data: UpdateAssignmentData,
    updatedBy: string
  ) {
    const assignment = await this.prisma.observerAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment', id);
    }

    const updateData: any = {};

    if (data.pollingStationId !== undefined) {
      // Verify polling station exists
      const pollingStation = await this.prisma.pollingStation.findUnique({
        where: { id: data.pollingStationId },
      });

      if (!pollingStation) {
        throw new NotFoundError('Polling station', data.pollingStationId);
      }

      updateData.pollingStationId = data.pollingStationId;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
      if (!data.isActive) {
        updateData.deactivatedAt = new Date();
        updateData.deactivatedBy = updatedBy;
        if (data.deactivationReason) {
          updateData.deactivationReason = data.deactivationReason;
        }
      } else {
        updateData.deactivatedAt = null;
        updateData.deactivatedBy = null;
        updateData.deactivationReason = null;
      }
    }

    const updated = await this.prisma.observerAssignment.update({
      where: { id },
      data: updateData,
      include: {
        observerRegistration: {
          include: {
            user: true,
          },
        },
        pollingStation: {
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
        },
      },
    });

    return updated;
  }

  /**
   * Delete assignment
   */
  async deleteAssignment(id: string) {
    const assignment = await this.prisma.observerAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment', id);
    }

    await this.prisma.observerAssignment.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get assignment statistics for active contests
   * Calculates per-contest statistics
   */
  async getAssignmentStatistics() {
    // Get all active elections
    const activeElections = await this.prisma.election.findMany({
      where: {
        status: 'active',
        deletedAt: null,
      },
      include: {
        contests: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    const totalActiveContests = activeElections.reduce(
      (sum, election) => sum + election.contests.length,
      0
    );

    // Get all active assignments
    const activeAssignments = await this.prisma.observerAssignment.findMany({
      where: {
        isActive: true,
      },
      select: {
        pollingStationId: true,
      },
    });

    const assignedStationIds = new Set(
      activeAssignments.map((a) => a.pollingStationId)
    );

    // Process each contest
    const contestStats: Array<{
      id: string;
      positionName: string;
      electionId: string;
      electionTitle: string;
      electionCode: string;
      totalStations: number;
      assignedStations: number;
      unassignedStations: number;
      progress: number;
      isFullyAssigned: boolean;
    }> = [];

    let totalStationsInActiveContests = 0;
    let totalAssignedStations = 0;
    let fullyAssignedContests = 0;

    for (const election of activeElections) {
      for (const contest of election.contests) {
        // Determine polling stations for this contest based on geographic scope
        let stationWhere: any = {
          isActive: true,
          deletedAt: null,
        };

        if (contest.wardId) {
          // Contest is ward-specific
          stationWhere.wardId = contest.wardId;
        } else if (contest.constituencyId) {
          // Contest is constituency-specific
          stationWhere.ward = {
            constituencyId: contest.constituencyId,
          };
        } else if (contest.countyId) {
          // Contest is county-specific
          stationWhere.ward = {
            constituency: {
              countyId: contest.countyId,
            },
          };
        }
        // If none specified, contest is nationwide - get all stations

        // Get polling stations for this contest
        const stations = await this.prisma.pollingStation.findMany({
          where: stationWhere,
          select: {
            id: true,
          },
        });

        const stationIds = stations.map((s) => s.id);
        const totalStations = stationIds.length;
        const assignedStations = stationIds.filter((id) =>
          assignedStationIds.has(id)
        ).length;
        const unassignedStations = totalStations - assignedStations;
        const progress =
          totalStations > 0 ? (assignedStations / totalStations) * 100 : 0;
        const isFullyAssigned = totalStations > 0 && assignedStations === totalStations;

        contestStats.push({
          id: contest.id,
          positionName: contest.positionName,
          electionId: election.id,
          electionTitle: election.title,
          electionCode: election.electionCode,
          totalStations,
          assignedStations,
          unassignedStations,
          progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
          isFullyAssigned,
        });

        totalStationsInActiveContests += totalStations;
        totalAssignedStations += assignedStations;
        if (isFullyAssigned) {
          fullyAssignedContests++;
        }
      }
    }

    const overallProgress =
      totalStationsInActiveContests > 0
        ? (totalAssignedStations / totalStationsInActiveContests) * 100
        : 0;

    return {
      totalActiveContests,
      totalStationsInActiveContests,
      assignedStations: totalAssignedStations,
      unassignedStations: totalStationsInActiveContests - totalAssignedStations,
      fullyAssignedContests,
      assignmentProgress: Math.round(overallProgress * 100) / 100,
      contests: contestStats,
    };
  }

  /**
   * Get agents assigned to multiple active contests
   * Returns observers who have active assignments in more than one contest
   */
  async getAgentsWithMultipleContests() {
    // Get all active elections
    const activeElections = await this.prisma.election.findMany({
      where: {
        status: 'active',
        deletedAt: null,
      },
      include: {
        contests: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    // Get all active assignments
    const activeAssignments = await this.prisma.observerAssignment.findMany({
      where: {
        isActive: true,
      },
      include: {
        observerRegistration: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        pollingStation: {
          select: {
            id: true,
            name: true,
            ward: {
              select: {
                name: true,
                constituency: {
                  select: {
                    name: true,
                    county: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Map assignments to contests
    const agentContestMap = new Map<
      string,
      Array<{
        contestId: string;
        contestName: string;
        electionId: string;
        electionTitle: string;
        pollingStationId: string;
        pollingStationName: string;
      }>
    >();

    for (const election of activeElections) {
      for (const contest of election.contests) {
        // Determine polling stations for this contest
        let stationWhere: any = {
          isActive: true,
          deletedAt: null,
        };

        if (contest.wardId) {
          stationWhere.wardId = contest.wardId;
        } else if (contest.constituencyId) {
          stationWhere.ward = {
            constituencyId: contest.constituencyId,
          };
        } else if (contest.countyId) {
          stationWhere.ward = {
            constituency: {
              countyId: contest.countyId,
            },
          };
        }

        const stations = await this.prisma.pollingStation.findMany({
          where: stationWhere,
          select: { id: true },
        });

        const stationIds = new Set(stations.map((s) => s.id));

        // Find assignments for stations in this contest
        for (const assignment of activeAssignments) {
          if (stationIds.has(assignment.pollingStationId)) {
            const observerId = assignment.observerRegistrationId;
            if (!agentContestMap.has(observerId)) {
              agentContestMap.set(observerId, []);
            }

            const contests = agentContestMap.get(observerId)!;
            // Check if this contest is already recorded for this agent
            const existingContest = contests.find(
              (c) => c.contestId === contest.id
            );
            if (!existingContest) {
              contests.push({
                contestId: contest.id,
                contestName: contest.positionName,
                electionId: election.id,
                electionTitle: election.title,
                pollingStationId: assignment.pollingStationId,
                pollingStationName: assignment.pollingStation.name,
              });
            }
          }
        }
      }
    }

    // Filter agents with multiple contests
    const agentsWithMultipleContests: Array<{
      observerId: string;
      observer: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phoneNumber: string;
      };
      contests: Array<{
        contestId: string;
        contestName: string;
        electionId: string;
        electionTitle: string;
        pollingStationId: string;
        pollingStationName: string;
      }>;
      totalContests: number;
    }> = [];

    for (const [observerId, contests] of agentContestMap.entries()) {
      if (contests.length > 1) {
        // Get observer details from first assignment
        const assignment = activeAssignments.find(
          (a) => a.observerRegistrationId === observerId
        );
        if (assignment) {
          agentsWithMultipleContests.push({
            observerId,
            observer: {
              id: assignment.observerRegistration.id,
              firstName: assignment.observerRegistration.firstName,
              lastName: assignment.observerRegistration.lastName,
              email: assignment.observerRegistration.email,
              phoneNumber: assignment.observerRegistration.phoneNumber,
            },
            contests,
            totalContests: contests.length,
          });
        }
      }
    }

    // Sort by total contests (descending)
    agentsWithMultipleContests.sort(
      (a, b) => b.totalContests - a.totalContests
    );

    return {
      total: agentsWithMultipleContests.length,
      agents: agentsWithMultipleContests,
    };
  }
}

