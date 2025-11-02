/**
 * Observer Admin Service
 * CRUD operations and analytics for observer management
 */

import { PrismaClient, ObserverStatus, Prisma } from '@prisma/client';
import { ValidationError, NotFoundError } from '@/shared/types/errors';
import { ObserverMinIOService } from './minio.service';

// Types for admin operations
export interface ObserverFilters {
  status?: ObserverStatus;
  location?: string;
  registrationStatus?: ObserverStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ObserverUpdateData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  status?: ObserverStatus;
  location?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}

export interface ObserverStats {
  total: number;
  active: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  inactive: number;
  assigned: number;
  unassigned: number;
  recentRegistrations: number; // Last 7 days
  recentApprovals: number; // Last 7 days
}

export interface ObserverAnalytics {
  registrationTrends: {
    date: string;
    count: number;
  }[];
  statusDistribution: {
    status: ObserverStatus;
    count: number;
    percentage: number;
  }[];
  locationDistribution: {
    location: string;
    count: number;
    percentage: number;
  }[];
  approvalRates: {
    period: string;
    approvalRate: number;
    totalApplications: number;
    approvedApplications: number;
  }[];
  activityMetrics: {
    totalObservers: number;
    activeObservers: number;
    averageResponseTime: number; // in hours
    completionRate: number; // percentage
  };
}

export class ObserverAdminService {
  constructor(
    private prisma: PrismaClient,
    private minioService?: ObserverMinIOService
  ) {}

  /**
   * Get all observers with filtering and pagination
   */
  async getObservers(filters: ObserverFilters = {}) {
    const {
      status,
      location,
      registrationStatus,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ObserverRegistrationWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (registrationStatus) {
      where.status = registrationStatus;
    }

    if (location) {
      where.OR = [
        {
          preferredCounty: {
            name: { contains: location, mode: 'insensitive' },
          },
        },
        {
          preferredConstituency: {
            name: { contains: location, mode: 'insensitive' },
          },
        },
        {
          preferredWard: { name: { contains: location, mode: 'insensitive' } },
        },
        {
          preferredStation: {
            name: { contains: location, mode: 'insensitive' },
          },
        },
      ];
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy: Prisma.ObserverRegistrationOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.firstName = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else if (sortBy === 'submissionDate') {
      orderBy.submissionDate = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [observers, total] = await Promise.all([
      this.prisma.observerRegistration.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          preferredCounty: { select: { id: true, name: true } },
          preferredConstituency: { select: { id: true, name: true } },
          preferredWard: { select: { id: true, name: true } },
          preferredStation: { select: { id: true, name: true } },
          reviewer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          user: { select: { id: true, isActive: true, lastLogin: true } },
          assignments: {
            include: {
              pollingStation: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.observerRegistration.count({ where }),
    ]);

    return {
      data: observers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get observer by ID
   */
  async getObserverById(id: string) {
    const observer = await this.prisma.observerRegistration.findUnique({
      where: { id },
      include: {
        preferredCounty: { select: { id: true, name: true } },
        preferredConstituency: { select: { id: true, name: true } },
        preferredWard: { select: { id: true, name: true } },
        preferredStation: { select: { id: true, name: true } },
        reviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        user: { select: { id: true, isActive: true, lastLogin: true } },
        assignments: {
          include: {
            pollingStation: {
              select: { id: true, name: true },
            },
            assigner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!observer) {
      throw new NotFoundError('Observer', id);
    }

    // Generate presigned URLs for images if MinIO service is available
    if (this.minioService) {
      const observerWithUrls = { ...observer };
      
      if (observer.profilePhotoUrl) {
        try {
          observerWithUrls.profilePhotoUrl = await this.minioService.getPresignedUrl(
            'observer-documents',
            observer.profilePhotoUrl,
            7 * 24 * 3600 // 7 days expiry
          );
        } catch (error: any) {
          console.error(`Error getting profile photo URL for ${observer.profilePhotoUrl}:`, error.message);
          // Set to null if file doesn't exist rather than breaking the response
          observerWithUrls.profilePhotoUrl = null;
        }
      }
      
      if (observer.nationalIdFrontUrl) {
        try {
          observerWithUrls.nationalIdFrontUrl = await this.minioService.getPresignedUrl(
            'observer-documents',
            observer.nationalIdFrontUrl,
            7 * 24 * 3600 // 7 days expiry
          );
        } catch (error: any) {
          console.error(`Error getting national ID front URL for ${observer.nationalIdFrontUrl}:`, error.message);
          observerWithUrls.nationalIdFrontUrl = null;
        }
      }
      
      if (observer.nationalIdBackUrl) {
        try {
          observerWithUrls.nationalIdBackUrl = await this.minioService.getPresignedUrl(
            'observer-documents',
            observer.nationalIdBackUrl,
            7 * 24 * 3600 // 7 days expiry
          );
        } catch (error: any) {
          console.error(`Error getting national ID back URL for ${observer.nationalIdBackUrl}:`, error.message);
          observerWithUrls.nationalIdBackUrl = null;
        }
      }
      
      return observerWithUrls;
    }

    return observer;
  }

  /**
   * Update observer
   */
  async updateObserver(
    id: string,
    data: ObserverUpdateData,
    reviewerId: string
  ) {
    try {
      // Get observer directly from DB (not the enriched version with presigned URLs)
      const observer = await this.prisma.observerRegistration.findUnique({
        where: { id },
      });

      if (!observer) {
        throw new NotFoundError('Observer', id);
      }

    // Validate email uniqueness if being updated
    if (data.email && data.email !== observer.email) {
      const existing = await this.prisma.observerRegistration.findFirst({
        where: { email: data.email, id: { not: id } },
      });

      if (existing) {
        throw new ValidationError('Email already registered', 'email');
      }
    }

    // Build update data object
    const updateData: Prisma.ObserverRegistrationUpdateInput = {
      updatedAt: new Date(),
    };
    
    // Set individual fields explicitly to ensure proper typing
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.reviewNotes !== undefined) updateData.reviewNotes = data.reviewNotes;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
    
    // Handle status update with proper enum type
    if (data.status !== undefined) {
      // Use Prisma enum directly to ensure type safety
      updateData.status = data.status;
    }

    // If status is being changed, add review information
    if (data.status && data.status !== observer.status) {
      updateData.reviewDate = new Date();
      
      // Connect reviewer (Prisma will handle reviewedBy automatically)
      // Don't verify existence - let Prisma throw if user doesn't exist
      updateData.reviewer = { connect: { id: reviewerId } };
    }

    const updatedObserver = await this.prisma.observerRegistration.update({
      where: { id },
      data: updateData,
      include: {
        preferredCounty: { select: { id: true, name: true } },
        preferredConstituency: { select: { id: true, name: true } },
        preferredWard: { select: { id: true, name: true } },
        preferredStation: { select: { id: true, name: true } },
        reviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        user: { select: { id: true, isActive: true, lastLogin: true } },
      },
    });

    // Generate presigned URLs for images if MinIO service is available
    if (this.minioService) {
      const observerWithUrls = { ...updatedObserver };
      
      if (updatedObserver.profilePhotoUrl) {
        try {
          observerWithUrls.profilePhotoUrl = await this.minioService.getPresignedUrl(
            'observer-documents',
            updatedObserver.profilePhotoUrl,
            7 * 24 * 3600 // 7 days expiry
          );
        } catch (error: any) {
          console.error(`Error getting profile photo URL for ${updatedObserver.profilePhotoUrl}:`, error.message);
          observerWithUrls.profilePhotoUrl = null;
        }
      }
      
      if (updatedObserver.nationalIdFrontUrl) {
        try {
          observerWithUrls.nationalIdFrontUrl = await this.minioService.getPresignedUrl(
            'observer-documents',
            updatedObserver.nationalIdFrontUrl,
            7 * 24 * 3600 // 7 days expiry
          );
        } catch (error: any) {
          console.error(`Error getting national ID front URL for ${updatedObserver.nationalIdFrontUrl}:`, error.message);
          observerWithUrls.nationalIdFrontUrl = null;
        }
      }
      
      if (updatedObserver.nationalIdBackUrl) {
        try {
          observerWithUrls.nationalIdBackUrl = await this.minioService.getPresignedUrl(
            'observer-documents',
            updatedObserver.nationalIdBackUrl,
            7 * 24 * 3600 // 7 days expiry
          );
        } catch (error: any) {
          console.error(`Error getting national ID back URL for ${updatedObserver.nationalIdBackUrl}:`, error.message);
          observerWithUrls.nationalIdBackUrl = null;
        }
      }
      
      return observerWithUrls;
    }

    return updatedObserver;
    } catch (error: any) {
      console.error('Error in updateObserver:', {
        error: error.message,
        stack: error.stack,
        id,
        status: data.status,
        reviewerId,
      });
      throw error;
    }
  }

  /**
   * Delete observer (soft delete by changing status)
   */
  async deleteObserver(id: string, reviewerId: string) {
    // Verify observer exists
    const observer = await this.prisma.observerRegistration.findUnique({
      where: { id },
    });

    if (!observer) {
      throw new NotFoundError('Observer', id);
    }

    // Soft delete by changing status to inactive
    const updatedObserver = await this.prisma.observerRegistration.update({
      where: { id },
      data: {
        status: 'inactive',
        reviewDate: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: 'Observer deactivated by admin',
        updatedAt: new Date(),
      },
    });

    return updatedObserver;
  }

  /**
   * Bulk update observer status
   */
  async bulkUpdateStatus(
    observerIds: string[],
    status: ObserverStatus,
    reviewerId: string,
    notes?: string
  ) {
    const result = await this.prisma.observerRegistration.updateMany({
      where: { id: { in: observerIds } },
      data: {
        status,
        reviewDate: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: notes,
        updatedAt: new Date(),
      },
    });

    return result;
  }

  /**
   * Get observer statistics
   */
  async getObserverStats(): Promise<ObserverStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      total,
      active,
      pending,
      approved,
      rejected,
      suspended,
      inactive,
      assigned,
      unassigned,
      recentRegistrations,
      recentApprovals,
    ] = await Promise.all([
      this.prisma.observerRegistration.count(),
      this.prisma.observerRegistration.count({ where: { status: 'active' } }),
      this.prisma.observerRegistration.count({
        where: { status: 'pending_review' },
      }),
      this.prisma.observerRegistration.count({ where: { status: 'approved' } }),
      this.prisma.observerRegistration.count({ where: { status: 'rejected' } }),
      this.prisma.observerRegistration.count({
        where: { status: 'suspended' },
      }),
      this.prisma.observerRegistration.count({ where: { status: 'inactive' } }),
      this.prisma.observerRegistration.count({
        where: { assignments: { some: {} } },
      }),
      this.prisma.observerRegistration.count({
        where: { assignments: { none: {} } },
      }),
      this.prisma.observerRegistration.count({
        where: { submissionDate: { gte: sevenDaysAgo } },
      }),
      this.prisma.observerRegistration.count({
        where: {
          status: 'approved',
          reviewDate: { gte: sevenDaysAgo },
        },
      }),
    ]);

    return {
      total,
      active,
      pending,
      approved,
      rejected,
      suspended,
      inactive,
      assigned,
      unassigned,
      recentRegistrations,
      recentApprovals,
    };
  }

  /**
   * Get observer analytics
   */
  async getObserverAnalytics(days: number = 30): Promise<ObserverAnalytics> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Registration trends
    const registrationTrends = await this.prisma.$queryRaw<
      { date: string; count: number }[]
    >`
      SELECT 
        DATE(submission_date) as date,
        COUNT(*) as count
      FROM observer_registrations 
      WHERE submission_date >= ${startDate}
      GROUP BY DATE(submission_date)
      ORDER BY date ASC
    `;

    // Status distribution
    const statusDistribution = await this.prisma.observerRegistration.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const totalObservers = statusDistribution.reduce(
      (sum, item) => sum + item._count.status,
      0
    );

    const statusDistributionWithPercentage = statusDistribution.map((item) => ({
      status: item.status,
      count: item._count.status,
      percentage:
        totalObservers > 0 ? (item._count.status / totalObservers) * 100 : 0,
    }));

    // Location distribution (based on preferred locations)
    const locationData = await this.prisma.observerRegistration.findMany({
      select: {
        preferredCounty: { select: { name: true } },
        preferredConstituency: { select: { name: true } },
        preferredWard: { select: { name: true } },
      },
    });

    const locationCounts: Record<string, number> = {};
    locationData.forEach((observer) => {
      const location =
        observer.preferredCounty?.name ||
        observer.preferredConstituency?.name ||
        observer.preferredWard?.name ||
        'Unassigned';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    const locationDistribution = Object.entries(locationCounts).map(
      ([location, count]) => ({
        location,
        count,
        percentage: totalObservers > 0 ? (count / totalObservers) * 100 : 0,
      })
    );

    // Approval rates by period
    const approvalRates = await this.prisma.$queryRaw<
      { period: string; total: number; approved: number }[]
    >`
      SELECT 
        DATE_TRUNC('week', submission_date) as period,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
      FROM observer_registrations 
      WHERE submission_date >= ${startDate}
      GROUP BY DATE_TRUNC('week', submission_date)
      ORDER BY period ASC
    `;

    const approvalRatesWithPercentage = approvalRates.map((item) => ({
      period: item.period,
      approvalRate: item.total > 0 ? (item.approved / item.total) * 100 : 0,
      totalApplications: item.total,
      approvedApplications: item.approved,
    }));

    // Activity metrics
    const activeObservers = await this.prisma.observerRegistration.count({
      where: { status: 'active' },
    });

    const activityMetrics = {
      totalObservers,
      activeObservers,
      averageResponseTime: 24, // Placeholder - would need to calculate based on review times
      completionRate:
        totalObservers > 0 ? (activeObservers / totalObservers) * 100 : 0,
    };

    return {
      registrationTrends,
      statusDistribution: statusDistributionWithPercentage,
      locationDistribution,
      approvalRates: approvalRatesWithPercentage,
      activityMetrics,
    };
  }

  /**
   * Export observers to CSV
   */
  async exportObservers(filters: ObserverFilters = {}) {
    const { data: observers } = await this.getObservers({
      ...filters,
      limit: 10000, // Large limit for export
    });

    return observers.map((observer) => ({
      'Tracking Number': observer.trackingNumber,
      'First Name': observer.firstName,
      'Last Name': observer.lastName,
      Email: observer.email,
      'Phone Number': observer.phoneNumber,
      'National ID': observer.nationalId,
      Status: observer.status,
      'Preferred County': observer.preferredCounty?.name || '',
      'Preferred Constituency': observer.preferredConstituency?.name || '',
      'Preferred Ward': observer.preferredWard?.name || '',
      'Preferred Station': observer.preferredStation?.name || '',
      'Submission Date': observer.submissionDate.toISOString(),
      'Review Date': observer.reviewDate?.toISOString() || '',
      Reviewer: observer.reviewer
        ? `${observer.reviewer.firstName} ${observer.reviewer.lastName}`
        : '',
      'Review Notes': observer.reviewNotes || '',
      'Rejection Reason': observer.rejectionReason || '',
      'Created At': observer.createdAt.toISOString(),
      'Updated At': observer.updatedAt.toISOString(),
    }));
  }
}
