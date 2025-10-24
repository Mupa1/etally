/**
 * Political Party Service
 * Business logic for managing political parties
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import MinIOService from '@/infrastructure/storage/minio.service';
import { NotFoundError, ValidationError } from '@/shared/types/errors';

interface ICreatePartyData {
  serialNumber?: string;
  certificateNumber: string;
  partyName: string;
  abbreviation?: string;
  certificateDate?: string;
  symbol?: string;
  colors?: string;
  postalAddress?: string;
  headOfficeLocation?: string;
  slogan?: string;
  changes?: string;
  logoUrl?: string;
  primaryColor?: string;
  affiliation?: 'main_party' | 'friendly_party' | 'competitor';
  isActive?: boolean;
}

interface IUpdatePartyData {
  serialNumber?: string | null;
  partyName?: string;
  abbreviation?: string | null;
  certificateDate?: string | null;
  symbol?: string | null;
  colors?: string | null;
  postalAddress?: string | null;
  headOfficeLocation?: string | null;
  slogan?: string | null;
  changes?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  affiliation?: 'main_party' | 'friendly_party' | 'competitor' | null;
  isActive?: boolean;
}

interface IPartyFilters {
  search?: string;
  isActive?: boolean;
  abbreviation?: string;
}

interface ICSVPartyData {
  'S/No': string;
  'Certificate Serial No.': string;
  'Name of the Party': string;
  Abbreviation: string;
  'Certificate Date of Issue': string;
  Symbol: string;
  Colors: string;
  'Postal Address of Party': string;
  'Location of Head Office of Party': string;
  Slogan: string;
  Changes: string;
}

class PartyService {
  private prisma: PrismaService;
  private minio: MinIOService;

  constructor() {
    this.prisma = PrismaService.getInstance();
    this.minio = MinIOService.getInstance();
  }

  /**
   * Parse color string to extract primary color hex
   */
  private parseColorToHex(colorString: string): string {
    const colorMap: Record<string, string> = {
      red: '#DC143C',
      blue: '#0047AB',
      green: '#228B22',
      yellow: '#FFD700',
      orange: '#FF8C00',
      purple: '#800080',
      black: '#000000',
      white: '#FFFFFF',
      brown: '#8B4513',
      grey: '#808080',
      gray: '#808080',
      gold: '#FFD700',
      maroon: '#800000',
      lilac: '#C8A2C8',
      pink: '#FFC0CB',
      'royal blue': '#4169E1',
      'earth red': '#CD5C5C',
      'navy blue': '#000080',
      'bottle green': '#006A4E',
      turquoise: '#40E0D0',
      olive: '#808000',
      emerald: '#50C878',
      beige: '#F5F5DC',
      violet: '#8F00FF',
    };

    const firstColor = colorString.toLowerCase().split(',')[0].trim();

    for (const [name, hex] of Object.entries(colorMap)) {
      if (firstColor.includes(name)) {
        return hex;
      }
    }

    return '#0047AB'; // Default blue
  }

  /**
   * Create a new political party
   */
  async createParty(data: ICreatePartyData) {
    // Check if party with same certificate number exists
    const existing = await this.prisma.politicalParty.findUnique({
      where: { certificateNumber: data.certificateNumber },
    });

    if (existing) {
      throw new ValidationError(
        `Party with certificate number "${data.certificateNumber}" already exists`
      );
    }

    // If colors provided but no primary color, extract it
    if (data.colors && !data.primaryColor) {
      data.primaryColor = this.parseColorToHex(data.colors);
    }

    const party = await this.prisma.politicalParty.create({
      data: {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return party;
  }

  /**
   * Get all political parties with optional filters
   */
  async getParties(filters?: IPartyFilters) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.abbreviation) {
      where.abbreviation = filters.abbreviation;
    }

    if (filters?.search) {
      where.OR = [
        { partyName: { contains: filters.search, mode: 'insensitive' } },
        { abbreviation: { contains: filters.search, mode: 'insensitive' } },
        {
          certificateNumber: { contains: filters.search, mode: 'insensitive' },
        },
      ];
    }

    const parties = await this.prisma.politicalParty.findMany({
      where,
      orderBy: [{ partyName: 'asc' }],
      include: {
        _count: {
          select: {
            candidates: true,
          },
        },
      },
    });

    // Get presigned URLs for logos
    const partiesWithUrls = await Promise.all(
      parties.map(async (party) => {
        let logoUrl = party.logoUrl;

        // If logo path exists, get presigned URL
        if (logoUrl) {
          try {
            logoUrl = await this.minio.getPartyLogoUrl(logoUrl);
          } catch (error) {
            console.error('Error getting logo URL:', error);
            logoUrl = null;
          }
        }

        return {
          ...party,
          logoUrl,
          candidateCount: party._count.candidates,
          _count: undefined,
        };
      })
    );

    return partiesWithUrls;
  }

  /**
   * Get party by ID
   */
  async getPartyById(id: string) {
    const party = await this.prisma.politicalParty.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidates: true,
          },
        },
      },
    });

    if (!party) {
      throw new NotFoundError('Political Party', id);
    }

    // Get presigned URL for logo if exists
    let logoUrl = party.logoUrl;
    if (logoUrl) {
      try {
        logoUrl = await this.minio.getPartyLogoUrl(logoUrl);
      } catch (error) {
        console.error('Error getting logo URL:', error);
        logoUrl = null;
      }
    }

    return {
      ...party,
      logoUrl,
      candidateCount: party._count.candidates,
      _count: undefined,
    };
  }

  /**
   * Get party by certificate number
   */
  async getPartyByCertificateNumber(certificateNumber: string) {
    const party = await this.prisma.politicalParty.findUnique({
      where: { certificateNumber },
      include: {
        _count: {
          select: {
            candidates: true,
          },
        },
      },
    });

    if (!party) {
      throw new NotFoundError('Political Party', certificateNumber);
    }

    return {
      ...party,
      candidateCount: party._count.candidates,
      _count: undefined,
    };
  }

  /**
   * Update party
   */
  async updateParty(id: string, data: IUpdatePartyData) {
    const existing = await this.prisma.politicalParty.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Political Party', id);
    }

    // If colors updated but no primary color, extract it
    if (data.colors && !data.primaryColor) {
      data.primaryColor = this.parseColorToHex(data.colors);
    }

    const party = await this.prisma.politicalParty.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            candidates: true,
          },
        },
      },
    });

    // Get presigned URL for logo if exists
    let logoUrl = party.logoUrl;
    if (logoUrl) {
      try {
        logoUrl = await this.minio.getPartyLogoUrl(logoUrl);
      } catch (error) {
        console.error('Error getting logo URL:', error);
        logoUrl = null;
      }
    }

    return {
      ...party,
      logoUrl,
      candidateCount: party._count.candidates,
      _count: undefined,
    };
  }

  /**
   * Delete party (soft delete)
   */
  async deleteParty(id: string) {
    const existing = await this.prisma.politicalParty.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidates: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Political Party', id);
    }

    // Check if party has candidates
    if (existing._count.candidates > 0) {
      throw new ValidationError(
        `Cannot delete party with ${existing._count.candidates} registered candidates. Deactivate instead.`
      );
    }

    await this.prisma.politicalParty.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return { message: 'Party deleted successfully' };
  }

  /**
   * Bulk upload parties from CSV data
   */
  async bulkUploadParties(parties: ICSVPartyData[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    };

    for (let i = 0; i < parties.length; i++) {
      const partyData = parties[i];
      try {
        // Map CSV data to our schema
        const data: ICreatePartyData = {
          serialNumber: partyData['S/No']?.trim(),
          certificateNumber: partyData['Certificate Serial No.']?.trim(),
          partyName: partyData['Name of the Party']?.trim(),
          abbreviation: partyData['Abbreviation']?.trim() || undefined,
          certificateDate: partyData['Certificate Date of Issue']?.trim(),
          symbol: partyData['Symbol']?.trim() || undefined,
          colors: partyData['Colors']?.trim() || undefined,
          postalAddress:
            partyData['Postal Address of Party']?.trim() || undefined,
          headOfficeLocation:
            partyData['Location of Head Office of Party']?.trim() || undefined,
          slogan: partyData['Slogan']?.trim() || undefined,
          changes: partyData['Changes']?.trim() || undefined,
          isActive: true,
        };

        // Validate required fields
        if (!data.certificateNumber || !data.partyName) {
          throw new ValidationError(
            'Certificate number and party name are required'
          );
        }

        // Check if party already exists
        const existing = await this.prisma.politicalParty.findUnique({
          where: { certificateNumber: data.certificateNumber },
        });

        if (existing) {
          // Update existing party
          await this.updateParty(existing.id, data);
          results.success++;
        } else {
          // Create new party
          await this.createParty(data);
          results.success++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 2, // +2 because: +1 for index, +1 for header row
          error: error.message,
          data: partyData,
        });
      }
    }

    return results;
  }

  /**
   * Get party statistics
   */
  async getPartyStatistics() {
    const [total, active, withCandidates] = await Promise.all([
      this.prisma.politicalParty.count(),
      this.prisma.politicalParty.count({ where: { isActive: true } }),
      this.prisma.politicalParty.count({
        where: {
          candidates: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      withCandidates,
      withoutCandidates: total - withCandidates,
    };
  }

  /**
   * Export parties to CSV format
   */
  async exportPartiesToCSV() {
    const parties = await this.prisma.politicalParty.findMany({
      orderBy: { partyName: 'asc' },
    });

    const headers = [
      'S/No',
      'Certificate Serial No.',
      'Name of the Party',
      'Abbreviation',
      'Certificate Date of Issue',
      'Symbol',
      'Colors',
      'Postal Address of Party',
      'Location of Head Office of Party',
      'Slogan',
      'Changes',
    ];

    const rows = parties.map((party) => [
      party.serialNumber || '',
      party.certificateNumber || '',
      party.partyName || '',
      party.abbreviation || '',
      party.certificateDate || '',
      party.symbol || '',
      party.colors || '',
      party.postalAddress || '',
      party.headOfficeLocation || '',
      party.slogan || '',
      party.changes || '',
    ]);

    return { headers, rows, parties };
  }

  /**
   * Upload party logo
   */
  async uploadLogo(
    partyId: string,
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // Verify party exists
    const party = await this.prisma.politicalParty.findUnique({
      where: { id: partyId },
    });

    if (!party) {
      throw new NotFoundError('Political Party', partyId);
    }

    // Delete old logo if exists
    if (party.logoUrl) {
      try {
        await this.minio.deletePartyLogo(party.logoUrl);
      } catch (error) {
        console.error('Error deleting old logo:', error);
      }
    }

    // Upload new logo
    const logoPath = await this.minio.uploadPartyLogo(
      partyId,
      file,
      fileName,
      mimeType
    );

    // Update party with new logo path
    await this.prisma.politicalParty.update({
      where: { id: partyId },
      data: { logoUrl: logoPath },
    });

    return logoPath;
  }

  /**
   * Get party logo presigned URL
   */
  async getLogoUrl(partyId: string): Promise<string | null> {
    const party = await this.prisma.politicalParty.findUnique({
      where: { id: partyId },
    });

    if (!party || !party.logoUrl) {
      return null;
    }

    return await this.minio.getPartyLogoUrl(party.logoUrl);
  }
}

export default PartyService;
