/**
 * Observer Registration Types and Interfaces
 * Phase 1: Observer Registration System
 */

import { ObserverStatus } from '@prisma/client';

// Registration form data
export interface ObserverRegistrationDTO {
  // Personal Information
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string; // ISO string
  phoneNumber: string;
  email?: string;

  // Preferred Assignment (optional)
  preferredCountyId?: string;
  preferredConstituencyId?: string;
  preferredWardId?: string;
  preferredStationId?: string;

  // Consent
  termsAccepted: boolean;
  dataProcessingConsent: boolean;
}

// Document upload data
export interface ObserverDocumentUpload {
  registrationId: string;
  documentType:
    | 'national_id_front'
    | 'national_id_back'
    | 'profile_photo'
    | 'additional';
  file: Buffer;
  fileName: string;
  mimeType: string;
}

// Registration response
export interface ObserverRegistrationResponse {
  success: boolean;
  trackingNumber: string;
  message: string;
  nextSteps: string;
}

// Application tracking
export interface ApplicationStatus {
  trackingNumber: string;
  status: ObserverStatus;
  submissionDate: string;
  reviewDate?: string;
  statusMessage: string;
  estimatedReviewTime: string;
}

// Password setup
export interface PasswordSetupDTO {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordSetupResponse {
  success: boolean;
  message: string;
  loginUrl: string;
}

// Application detail for admin review
export interface ObserverApplicationDetail {
  id: string;
  trackingNumber: string;

  // Personal Info
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  phoneNumber: string;
  email?: string;

  // Preferred Location
  preferredLocation?: {
    county?: string;
    constituency?: string;
    ward?: string;
    station?: string;
  };

  // Documents (presigned URLs)
  documents: {
    nationalIdFront?: string;
    nationalIdBack?: string;
    profilePhoto?: string;
  };

  // Status
  status: ObserverStatus;
  submissionDate: string;
  reviewDate?: string;
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewNotes?: string;
  rejectionReason?: string;
}

// Review action
export interface ReviewApplicationDTO {
  action: 'approve' | 'reject' | 'request_clarification';
  notes?: string;
  rejectionReason?: string;
}

// Tracking number generation
export function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0');
  return `OBS-${year}-${random}`;
}

// Age validation helper
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}
