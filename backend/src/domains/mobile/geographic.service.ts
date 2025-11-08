/**
 * Mobile Geographic Service
 * Lightweight geographic data for public observer registration
 */

import PrismaService from '@/infrastructure/database/prisma.service';

export class MobileGeographicService {
  private prisma = PrismaService.getInstance();

  /**
   * Get all counties (public, lightweight)
   */
  async getCounties() {
    const counties = await this.prisma.county.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return counties;
  }

  /**
   * Get constituencies for a county
   */
  async getConstituencies(countyId: string) {
    const constituencies = await this.prisma.constituency.findMany({
      where: {
        countyId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        countyId: true,
      },
      orderBy: { name: 'asc' },
    });

    return constituencies;
  }

  /**
   * Get wards for a constituency
   */
  async getWards(constituencyId: string) {
    const wards = await this.prisma.electoralWard.findMany({
      where: {
        constituencyId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        constituencyId: true,
      },
      orderBy: { name: 'asc' },
    });

    return wards;
  }

  /**
   * Get polling stations for a ward
   */
  async getPollingStations(wardId: string) {
    const stations = await this.prisma.pollingStation.findMany({
      where: {
        wardId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        wardId: true,
        registeredVoters: true,
      },
      orderBy: { name: 'asc' },
    });

    return stations;
  }

  /**
   * Get complete hierarchy for a location (for pre-filling form)
   */
  async getLocationHierarchy(stationId: string) {
    const station = await this.prisma.pollingStation.findUnique({
      where: { id: stationId },
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
    });

    if (!station) {
      return null;
    }

    return {
      county: {
        id: station.ward.constituency.county.id,
        code: station.ward.constituency.county.code,
        name: station.ward.constituency.county.name,
      },
      constituency: {
        id: station.ward.constituency.id,
        code: station.ward.constituency.code,
        name: station.ward.constituency.name,
      },
      ward: {
        id: station.ward.id,
        code: station.ward.code,
        name: station.ward.name,
      },
      station: {
        id: station.id,
        code: station.code,
        name: station.name,
        registeredVoters: station.registeredVoters,
      },
    };
  }
}
