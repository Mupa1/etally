/**
 * Observer Registration Service
 * Phase 1: Core registration, approval, and password setup logic
 */

import { PrismaClient, ObserverStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ValidationError } from '@/shared/types/errors';
import {
  ObserverRegistrationDTO,
  PasswordSetupDTO,
  ObserverRegistrationResponse,
  ApplicationStatus,
  PasswordSetupResponse,
  ObserverApplicationDetail,
  ReviewApplicationDTO,
  generateTrackingNumber,
  calculateAge,
} from './observer.types';
import { SmsService } from './sms.service';

export class ObserverService {
  constructor(
    private prisma: PrismaClient,
    private minioService: any, // Will be injected
    private smsService: SmsService // Will be injected
  ) {}

  /**
   * Register new field observer (public endpoint)
   */
  async registerObserver(
    data: ObserverRegistrationDTO
  ): Promise<ObserverRegistrationResponse> {
    // Validate age
    const dob = new Date(data.dateOfBirth);
    const age = calculateAge(dob);
    if (age < 18) {
      throw new ValidationError(
        'Observer must be at least 18 years old',
        'dateOfBirth'
      );
    }

    // Check for duplicates
    const duplicateConditions = [{ nationalId: data.nationalId }];
    if (data.email) {
      duplicateConditions.push({ email: data.email });
    }

    const existing = await this.prisma.observerRegistration.findFirst({
      where: {
        OR: duplicateConditions,
      },
    });

    if (existing) {
      if (existing.nationalId === data.nationalId) {
        throw new ValidationError(
          'National ID already registered',
          'nationalId'
        );
      }
      if (data.email && existing.email === data.email) {
        throw new ValidationError('Email already registered', 'email');
      }
    }

    // Generate tracking number
    const trackingNumber = generateTrackingNumber();

    // Create registration
    await this.prisma.observerRegistration.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        nationalId: data.nationalId,
        dateOfBirth: dob,
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        preferredCountyId: data.preferredCountyId,
        preferredConstituencyId: data.preferredConstituencyId,
        preferredWardId: data.preferredWardId,
        preferredStationId: data.preferredStationId,
        termsAccepted: data.termsAccepted,
        dataProcessingConsent: data.dataProcessingConsent,
        trackingNumber,
        status: 'pending_review',
      },
    });

    // Send confirmation SMS (non-blocking - don't fail registration if SMS fails)
    try {
      await this.smsService.sendRegistrationConfirmation(
        data.phoneNumber,
        data.firstName,
        trackingNumber
      );
    } catch (smsError: any) {
      console.error(
        'Failed to send registration confirmation SMS:',
        smsError.message
      );
      // Continue with registration - SMS failure should not block observer registration
    }

    return {
      success: true,
      trackingNumber,
      message: 'Application submitted successfully',
      nextSteps:
        'You will receive an SMS when your application is reviewed (typically within 24-48 hours)',
    };
  }

  /**
   * Track application status by tracking number
   */
  async trackApplication(trackingNumber: string): Promise<ApplicationStatus> {
    const application = await this.prisma.observerRegistration.findUnique({
      where: { trackingNumber },
      select: {
        status: true,
        submissionDate: true,
        reviewDate: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    const statusMessages: Record<ObserverStatus, string> = {
      pending_review:
        'Your application is under review. You will be notified via SMS once reviewed.',
      more_information_requested:
        'We need more information to complete your application review. Please check your SMS messages for details.',
      approved:
        'Your application has been approved! Check your SMS messages for the password setup link.',
      active: 'Your account is active. You can login to the observer portal.',
      rejected:
        'Your application was not approved. Check your SMS messages for details.',
      suspended:
        'Your account has been suspended. Contact support for more information.',
      inactive: 'Your account is inactive.',
    };

    return {
      trackingNumber,
      status: application.status,
      submissionDate: application.submissionDate.toISOString(),
      reviewDate: application.reviewDate?.toISOString(),
      statusMessage: statusMessages[application.status],
      estimatedReviewTime:
        application.status === 'pending_review' ? '24-48 hours' : 'N/A',
    };
  }

  /**
   * Get full application details by tracking number (for viewing/editing)
   */
  async getApplicationByTrackingNumber(trackingNumber: string) {
    const application = await this.prisma.observerRegistration.findUnique({
      where: { trackingNumber },
      include: {
        preferredCounty: {
          select: { id: true, name: true },
        },
        preferredConstituency: {
          select: { id: true, name: true },
        },
        preferredWard: {
          select: { id: true, name: true },
        },
        preferredStation: {
          select: { id: true, name: true },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    return {
      id: application.id,
      trackingNumber: application.trackingNumber,
      firstName: application.firstName,
      lastName: application.lastName,
      nationalId: application.nationalId,
      dateOfBirth: application.dateOfBirth.toISOString(),
      phoneNumber: application.phoneNumber,
      email: application.email || undefined,
      preferredCountyId: application.preferredCountyId,
      preferredConstituencyId: application.preferredConstituencyId,
      preferredWardId: application.preferredWardId,
      preferredStationId: application.preferredStationId,
      preferredCounty: application.preferredCounty,
      preferredConstituency: application.preferredConstituency,
      preferredWard: application.preferredWard,
      preferredStation: application.preferredStation,
      status: application.status,
      reviewNotes: application.reviewNotes,
      submissionDate: application.submissionDate.toISOString(),
      reviewDate: application.reviewDate?.toISOString(),
    };
  }

  /**
   * Update application details by tracking number
   * Only allowed when status is 'more_information_requested'
   */
  async updateApplicationByTrackingNumber(
    trackingNumber: string,
    updateData: Partial<ObserverRegistrationDTO>
  ) {
    // Get current application to check status
    const application = await this.prisma.observerRegistration.findUnique({
      where: { trackingNumber },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Only allow updates when more information is requested
    if (application.status !== 'more_information_requested') {
      throw new Error(
        'Application can only be updated when more information is requested'
      );
    }

    // Prepare update data
    const dataToUpdate: any = {};

    if (updateData.firstName !== undefined) {
      dataToUpdate.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      dataToUpdate.lastName = updateData.lastName;
    }
    if (updateData.phoneNumber !== undefined) {
      dataToUpdate.phoneNumber = updateData.phoneNumber;
    }
    if (updateData.email !== undefined) {
      const sanitizedEmail = updateData.email?.trim();
      dataToUpdate.email = sanitizedEmail ? sanitizedEmail : null;
    }
    if (updateData.dateOfBirth !== undefined) {
      dataToUpdate.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.preferredCountyId !== undefined) {
      dataToUpdate.preferredCountyId = updateData.preferredCountyId || null;
    }
    if (updateData.preferredConstituencyId !== undefined) {
      dataToUpdate.preferredConstituencyId =
        updateData.preferredConstituencyId || null;
    }
    if (updateData.preferredWardId !== undefined) {
      dataToUpdate.preferredWardId = updateData.preferredWardId || null;
    }
    if (updateData.preferredStationId !== undefined) {
      dataToUpdate.preferredStationId = updateData.preferredStationId || null;
    }

    // Update application
    const updated = await this.prisma.observerRegistration.update({
      where: { trackingNumber },
      data: dataToUpdate,
      include: {
        preferredCounty: {
          select: { id: true, name: true },
        },
        preferredConstituency: {
          select: { id: true, name: true },
        },
        preferredWard: {
          select: { id: true, name: true },
        },
        preferredStation: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      id: updated.id,
      trackingNumber: updated.trackingNumber,
      firstName: updated.firstName,
      lastName: updated.lastName,
      nationalId: updated.nationalId,
      dateOfBirth: updated.dateOfBirth.toISOString(),
      phoneNumber: updated.phoneNumber,
      email: updated.email || undefined,
      preferredCountyId: updated.preferredCountyId,
      preferredConstituencyId: updated.preferredConstituencyId,
      preferredWardId: updated.preferredWardId,
      preferredStationId: updated.preferredStationId,
      preferredCounty: updated.preferredCounty,
      preferredConstituency: updated.preferredConstituency,
      preferredWard: updated.preferredWard,
      preferredStation: updated.preferredStation,
      status: updated.status,
      reviewNotes: updated.reviewNotes,
      submissionDate: updated.submissionDate.toISOString(),
      reviewDate: updated.reviewDate?.toISOString(),
    };
  }

  /**
   * Get all observer applications for admin review
   */
  async getApplications(filters?: {
    status?: ObserverStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { nationalId: { contains: filters.search } },
        { trackingNumber: { contains: filters.search } },
      ];
    }

    const [applications, total] = await Promise.all([
      this.prisma.observerRegistration.findMany({
        where,
        include: {
          preferredCounty: true,
          preferredConstituency: true,
          preferredWard: true,
          preferredStation: true,
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { submissionDate: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.observerRegistration.count({ where }),
    ]);

    return {
      applications,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Get application detail for admin review
   */
  async getApplicationDetail(
    applicationId: string
  ): Promise<ObserverApplicationDetail> {
    const application = await this.prisma.observerRegistration.findUnique({
      where: { id: applicationId },
      include: {
        preferredCounty: true,
        preferredConstituency: true,
        preferredWard: true,
        preferredStation: true,
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Generate presigned URLs for documents
    const documents: any = {};
    if (application.nationalIdFrontUrl) {
      documents.nationalIdFront = await this.minioService.getPresignedUrl(
        'observer-documents',
        application.nationalIdFrontUrl,
        3600 // 1 hour
      );
    }
    if (application.nationalIdBackUrl) {
      documents.nationalIdBack = await this.minioService.getPresignedUrl(
        'observer-documents',
        application.nationalIdBackUrl,
        3600
      );
    }
    if (application.profilePhotoUrl) {
      documents.profilePhoto = await this.minioService.getPresignedUrl(
        'observer-documents',
        application.profilePhotoUrl,
        3600
      );
    }

    return {
      id: application.id,
      trackingNumber: application.trackingNumber,
      firstName: application.firstName,
      lastName: application.lastName,
      nationalId: application.nationalId,
      dateOfBirth: application.dateOfBirth.toISOString(),
      phoneNumber: application.phoneNumber,
      email: application.email || undefined,
      preferredLocation: {
        county: application.preferredCounty?.name,
        constituency: application.preferredConstituency?.name,
        ward: application.preferredWard?.name,
        station: application.preferredStation?.name,
      },
      documents,
      status: application.status,
      submissionDate: application.submissionDate.toISOString(),
      reviewDate: application.reviewDate?.toISOString(),
      reviewedBy: application.reviewer
        ? {
            id: application.reviewer.id,
            name: `${application.reviewer.firstName} ${application.reviewer.lastName}`,
          }
        : undefined,
      reviewNotes: application.reviewNotes || undefined,
      rejectionReason: application.rejectionReason || undefined,
    };
  }

  /**
   * Review observer application (approve/reject)
   */
  async reviewApplication(
    applicationId: string,
    reviewData: ReviewApplicationDTO,
    reviewerId: string
  ) {
    const application = await this.prisma.observerRegistration.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'pending_review') {
      throw new Error(`Application already ${application.status}`);
    }

    if (reviewData.action === 'approve') {
      return await this.approveApplication(
        applicationId,
        reviewerId,
        reviewData.notes
      );
    } else if (reviewData.action === 'reject') {
      return await this.rejectApplication(
        applicationId,
        reviewerId,
        reviewData.rejectionReason!
      );
    } else {
      return await this.requestClarification(
        applicationId,
        reviewerId,
        reviewData.notes!
      );
    }
  }

  /**
   * Approve application - Creates User account and sends password setup email
   */
  private async approveApplication(
    applicationId: string,
    reviewerId: string,
    notes?: string
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Get application
      const application = await tx.observerRegistration.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // 2. Update application status
      await tx.observerRegistration.update({
        where: { id: applicationId },
        data: {
          status: 'approved',
          reviewDate: new Date(),
          reviewedBy: reviewerId,
          reviewNotes: notes,
        },
      });

      // 3. Create User account with field_observer role
      const user = await tx.user.create({
        data: {
          nationalId: application.nationalId,
          email: application.email || null,
          phoneNumber: application.phoneNumber,
          firstName: application.firstName,
          lastName: application.lastName,
          role: 'field_observer',
          isActive: false, // Will activate after password setup
          passwordHash: '', // Will be set during password setup
          registrationStatus: 'approved',
        },
      });

      // 4. Link application to user
      await tx.observerRegistration.update({
        where: { id: applicationId },
        data: { userId: user.id },
      });

      // 5. Generate password setup token (valid for 48 hours)
      const setupToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await tx.passwordSetupToken.create({
        data: {
          token: setupToken,
          userId: user.id,
          expiresAt: expiry,
        },
      });

      // 6. Create audit log
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'observer_approval',
          entityId: applicationId,
          userId: reviewerId,
          newValues: {
            status: 'approved',
            userId: user.id,
            notes,
          },
        },
      });

      // 7. Send password setup SMS (non-blocking)
      if (user.phoneNumber) {
        try {
          await this.smsService.sendPasswordSetupSms(
            user.phoneNumber,
            user.firstName,
            setupToken
          );
        } catch (smsError: any) {
          console.error(
            'Failed to send password setup SMS:',
            smsError.message
          );
        }
      } else {
        console.warn(
          'Skipping password setup SMS - user is missing phone number',
          { userId: user.id, applicationId }
        );
      }

      return {
        success: true,
        userId: user.id,
        setupTokenSent: true,
      };
    });
  }

  /**
   * Reject application
   */
  private async rejectApplication(
    applicationId: string,
    reviewerId: string,
    rejectionReason: string
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Update application status
      await tx.observerRegistration.update({
        where: { id: applicationId },
        data: {
          status: 'rejected',
          reviewDate: new Date(),
          reviewedBy: reviewerId,
          rejectionReason,
        },
      });

      // Get application for notification
      const application = await tx.observerRegistration.findUnique({
        where: { id: applicationId },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'observer_rejection',
          entityId: applicationId,
          userId: reviewerId,
          newValues: {
            status: 'rejected',
            rejectionReason,
          },
        },
      });

      // Send rejection SMS (non-blocking)
      if (application) {
        if (application.phoneNumber) {
          try {
            await this.smsService.sendRejectionSms(
              application.phoneNumber,
              application.firstName,
              rejectionReason
            );
          } catch (smsError: any) {
            console.error('Failed to send rejection SMS:', smsError.message);
          }
        } else {
          console.warn(
            'Skipping rejection SMS - application is missing phone number',
            { applicationId }
          );
        }
      }

      return {
        success: true,
        status: 'rejected',
      };
    });
  }

  /**
   * Request clarification from applicant
   */
  private async requestClarification(
    applicationId: string,
    reviewerId: string,
    notes: string
  ) {
    const application = await this.prisma.observerRegistration.update({
      where: { id: applicationId },
      data: {
        reviewNotes: notes,
        reviewedBy: reviewerId,
      },
    });

    // Send clarification request SMS (non-blocking)
    if (application.phoneNumber) {
      try {
        await this.smsService.sendClarificationRequestSms(
          application.phoneNumber,
          application.firstName,
          notes,
          application.trackingNumber
        );
      } catch (smsError: any) {
        console.error(
          'Failed to send clarification request SMS:',
          smsError.message
        );
      }
    } else {
      console.warn(
        'Skipping clarification SMS - application is missing phone number',
        { applicationId }
      );
    }

    return {
      success: true,
      status: 'clarification_requested',
    };
  }

  /**
   * Set up password for approved observer
   */
  async setupPassword(data: PasswordSetupDTO): Promise<PasswordSetupResponse> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Validate token
      const tokenRecord = await tx.passwordSetupToken.findUnique({
        where: { token: data.token },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new Error('Invalid setup token');
      }

      if (tokenRecord.usedAt) {
        throw new Error('Setup token already used');
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new Error('Setup token expired');
      }

      // 2. Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // 3. Update user
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: {
          passwordHash,
          isActive: true,
        },
      });

      // 4. Update observer registration status
      await tx.observerRegistration.update({
        where: { userId: tokenRecord.userId },
        data: {
          status: 'active',
        },
      });

      // 5. Mark token as used
      await tx.passwordSetupToken.update({
        where: { id: tokenRecord.id },
        data: {
          usedAt: new Date(),
        },
      });

      // 6. Create audit log
      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'observer_activation',
          entityId: tokenRecord.userId,
          userId: tokenRecord.userId,
          newValues: {
            passwordSet: true,
            accountActivated: true,
          },
        },
      });

      // 7. Send welcome SMS (non-blocking)
      if (tokenRecord.user.phoneNumber) {
        try {
          await this.smsService.sendWelcomeSms(
            tokenRecord.user.phoneNumber,
            tokenRecord.user.firstName
          );
        } catch (smsError: any) {
          console.error('Failed to send welcome SMS:', smsError.message);
        }
      } else {
        console.warn(
          'Skipping welcome SMS - user is missing phone number',
          { userId: tokenRecord.user.id }
        );
      }

      return {
        success: true,
        message: 'Password set successfully. You can now login.',
        loginUrl: '/mobile/login',
      };
    });
  }

  /**
   * Upload observer documents
   */
  async uploadDocument(
    trackingNumber: string,
    documentType: 'national_id_front' | 'national_id_back' | 'profile_photo',
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    const application = await this.prisma.observerRegistration.findUnique({
      where: { trackingNumber },
    });

    if (!application) {
      throw new ValidationError('Application not found', 'trackingNumber');
    }

    if (
      application.status !== 'pending_review' &&
      application.status !== 'approved'
    ) {
      throw new ValidationError(
        'Cannot upload documents for this application',
        'status'
      );
    }

    // Upload to MinIO
    const objectPath = `${application.nationalId}/${documentType}-${Date.now()}.${fileName.split('.').pop()}`;
    await this.minioService.uploadFile(
      'observer-documents',
      objectPath,
      file,
      mimeType
    );

    // Update application with document URL
    const updateData: any = {};
    if (documentType === 'national_id_front') {
      updateData.nationalIdFrontUrl = objectPath;
    } else if (documentType === 'national_id_back') {
      updateData.nationalIdBackUrl = objectPath;
    } else if (documentType === 'profile_photo') {
      updateData.profilePhotoUrl = objectPath;
    }

    await this.prisma.observerRegistration.update({
      where: { id: application.id },
      data: updateData,
    });

    return objectPath;
  }

  /**
   * Get observer statistics for dashboard
   */
  async getObserverStatistics() {
    const [pending, approved, active, rejected, total] = await Promise.all([
      this.prisma.observerRegistration.count({
        where: { status: 'pending_review' },
      }),
      this.prisma.observerRegistration.count({ where: { status: 'approved' } }),
      this.prisma.observerRegistration.count({ where: { status: 'active' } }),
      this.prisma.observerRegistration.count({ where: { status: 'rejected' } }),
      this.prisma.observerRegistration.count(),
    ]);

    return {
      total,
      pending,
      approved,
      active,
      rejected,
      pendingReviewPercentage: total > 0 ? (pending / total) * 100 : 0,
    };
  }

  /**
   * Bulk approve applications
   */
  async bulkApprove(applicationIds: string[], reviewerId: string) {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>,
    };

    for (const applicationId of applicationIds) {
      try {
        await this.approveApplication(applicationId, reviewerId);
        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          id: applicationId,
          error: error.message,
        });
      }
    }

    return results;
  }

  // ==========================================
  // MOBILE PWA SERVICE METHODS
  // ==========================================

  /**
   * Get observer profile for authenticated observer
   */
  async getObserverProfile(userId: string) {
    const observer = await this.prisma.observerRegistration.findFirst({
      where: { userId },
      include: {
        preferredCounty: true,
        preferredConstituency: true,
        reviewer: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!observer) {
      throw new Error('Observer profile not found');
    }

    return observer;
  }

  /**
   * Update observer profile
   */
  async updateObserverProfile(userId: string, updateData: any) {
    const observer = await this.prisma.observerRegistration.findFirst({
      where: { userId },
    });

    if (!observer) {
      throw new Error('Observer profile not found');
    }

    const updatedObserver = await this.prisma.observerRegistration.update({
      where: { id: observer.id },
      data: updateData,
      include: {
        preferredCounty: true,
        preferredConstituency: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
    });

    return updatedObserver;
  }

  /**
   * Get observer assignments
   */
  async getObserverAssignments(userId: string) {
    const assignments = await this.prisma.observerAssignment.findMany({
      where: { observerRegistrationId: userId },
      include: {
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

    return assignments;
  }

  /**
   * Get observer status and registration info
   */
  async getObserverStatus(userId: string) {
    const observer = await this.prisma.observerRegistration.findFirst({
      where: { userId },
      include: {
        preferredCounty: true,
        preferredConstituency: true,
        reviewer: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!observer) {
      throw new Error('Observer not found');
    }

    return {
      registration: observer,
      status: observer.status,
      isApproved: observer.status === 'approved',
      isActive: observer.user?.isActive || false,
    };
  }

  // ==========================================
  // APPLICATION MANAGEMENT SERVICE METHODS
  // ==========================================

  /**
   * Bulk reject applications
   */
  async bulkRejectApplications(applicationIds: string[], reason: string) {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>,
    };

    for (const applicationId of applicationIds) {
      try {
        await this.prisma.observerRegistration.update({
          where: { id: applicationId },
          data: {
            status: 'rejected',
            rejectionReason: reason,
            reviewDate: new Date(),
          },
        });
        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          id: applicationId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Export applications to CSV
   */
  async exportApplications() {
    const applications = await this.prisma.observerRegistration.findMany({
      include: {
        preferredCounty: true,
        preferredConstituency: true,
        reviewer: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Simple CSV generation
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Status',
      'County',
      'Constituency',
      'Created At',
      'Reviewed At',
    ];

    const rows = applications.map((app) => [
      app.id,
      app.user?.firstName || '',
      app.user?.lastName || '',
      app.user?.email || '',
      app.user?.phoneNumber || '',
      app.status,
      app.preferredCounty?.name || '',
      app.preferredConstituency?.name || '',
      app.createdAt.toISOString(),
      app.reviewDate?.toISOString() || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Delete application (soft delete)
   */
  async deleteApplication(applicationId: string) {
    await this.prisma.observerRegistration.update({
      where: { id: applicationId },
      data: { status: 'inactive' },
    });
  }
}
