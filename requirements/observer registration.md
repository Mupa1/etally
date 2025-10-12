# Election Management System

## OBSERVER REGISTRATION & AUTHENTICATION JOURNEY

### Technical Specification Document

**Version:** 1.1  
**Last Updated:** 2024-01-15  
**Status:** Ready for Implementation  
**Document Owner:** Technical Architecture Team

---

## 1. EXECUTIVE SUMMARY

This document defines the complete user journey for election observer registration, authentication, and onboarding. The system implements a multi-layer verification process ensuring only authorized observers can submit election results through the mobile application.

### Key Features:

- **One User, One Device Policy**: Strict IMEI binding during registration
- **Multi-step Registration**: OTP verification + admin approval + IMEI binding
- **Role-Based Access**: Observers can only view/submit results for assigned polling stations
- **Polling Center Assignment**: Users assigned to multiple stations within one polling center
- **Security-First Approach**: Device binding, audit trails, and comprehensive validation

---

## 2. USER JOURNEY FLOW

### 2.1 Complete Registration & Authentication Flow

```mermaid
graph TD
    A[User Downloads App] --> B[Registration Screen]
    B --> C[Enter Mobile Number +2547XXXXXXXX]
    C --> D[Send OTP via SMS]
    D --> E[Verify OTP Code]
    E --> F[Set Password & Basic Info + Capture IMEI]
    F --> G[Status: Pending Approval]
    G --> H[Admin Notification]
    H --> I{Admin Review}
    I -->|Approve| J[Status: Approved]
    I -->|Reject| K[Status: Rejected + Reason]
    J --> L[Admin Assigns Polling Stations]
    L --> M[Active: Can Login & Submit Results]
    M --> N[Dashboard: View Assigned Stations]

    style A fill:#e1f5fe
    style M fill:#c8e6c9
    style I fill:#fff3e0

2.2 Critical Business Rules
2.2.1 Device Assignment Rules
One User → One Device: Each user can register only one IMEI

One Device → One User: Each IMEI can be used by only one user

IMEI Captured During Registration: IMEI collection is part of initial registration flow

No Device Changes Without Admin Approval: Lost/stolen devices require admin intervention

2.2.2 Polling Station Assignment Rules
One User → Multiple Stations: A single observer can be assigned to multiple polling stations

Stations Within One Center: Typically, all assigned stations are within one polling center

Geographic Consistency: Stations assigned to a user are geographically co-located

3. DATABASE SCHEMA ENHANCEMENTS
3.1 Extended User Model with IMEI Integration
// ADD TO EXISTING SCHEMA
enum UserRegistrationStatus {
  pending
  approved
  rejected
  suspended
}

enum OTPPurpose {
  registration
  login
  password_reset
  change_mobile
}

// EXTEND User model with IMEI at registration
model User {
  // ... existing fields ...

  // Registration-specific fields
  mobileNumber          String                 @unique
  nationalId            String                 @unique
  registrationStatus    UserRegistrationStatus @default(pending)
  rejectionReason       String?

  // IMEI CAPTURED DURING REGISTRATION
  imeiNumber           String?                @unique
  deviceModel          String?
  osVersion            String?
  appVersion           String?
  deviceRegisteredAt   DateTime?

  // Timestamps for registration lifecycle
  registrationSubmittedAt DateTime             @default(now())
  approvedAt            DateTime?
  rejectedAt            DateTime?

  // Relations
  assignedStations      UserPollingStationAssignment[]
  otpVerifications      OTPVerification[]

  @@index([mobileNumber])
  @@index([nationalId])
  @@index([registrationStatus])
  @@index([imeiNumber])  // For quick IMEI duplicate checks
  @@map("users")
}

// NEW MODELS
model OTPVerification {
  id           String    @id @default(uuid())
  mobileNumber String
  otpCode      String    // 6-digit code
  purpose      OTPPurpose @default(registration)
  expiresAt    DateTime
  verifiedAt   DateTime?
  attempts     Int       @default(0)
  maxAttempts  Int       @default(3)
  isUsed       Boolean   @default(false)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([mobileNumber, purpose])
  @@index([expiresAt])
  @@map("otp_verifications")
}

model UserPollingStationAssignment {
  id               String         @id @default(uuid())
  userId           String
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  pollingStationId String
  pollingStation   PollingStation @relation(fields: [pollingStationId], references: [id])
  assignedBy       String         // Admin user ID
  assignedAt       DateTime       @default(now())
  isActive         Boolean        @default(true)

  @@unique([userId, pollingStationId])
  @@index([userId, isActive])
  @@map("user_polling_station_assignments")
}

// ENHANCED POLLING STATION MODEL
model PollingStation {
  id               String        @id @default(uuid())
  code             String        @unique
  name             String
  wardId           String
  ward             ElectoralWard @relation(fields: [wardId], references: [id])

  // Polling center information
  pollingCenterCode String       // Code for the physical building/center
  pollingCenterName String       // Name of the physical building/center

  latitude         Float?
  longitude        Float?
  registeredVoters Int           @default(0)
  isActive         Boolean       @default(true)

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  // Relations
  results          ElectionResult[]
  incidents        Incident[]
  assignments      UserPollingStationAssignment[]

  @@index([wardId])
  @@index([code])
  @@index([pollingCenterCode])  // For grouping stations by center
  @@index([isActive])
  @@map("polling_stations")
}

4. DEVICE & STATION ASSIGNMENT RULES
4.1 Strict IMEI Enforcement
interface DeviceAssignmentRules {
  // ONE USER → ONE DEVICE
  maxDevicesPerUser: 1;

  // ONE DEVICE → ONE USER
  allowMultipleUsersPerDevice: false;

  // IMEI CAPTURED AT REGISTRATION
  imeiCollectionPhase: 'registration';

  // DEVICE CHANGE POLICY
  allowDeviceChanges: false; // Initially false, require admin process
  lostDeviceProcess: 'admin_approval_required';

  // VALIDATION RULES
  validation: {
    imeiFormat: '15_digits_luhn_verified';
    deviceModel: 'optional_but_recommended';
    osVersion: 'capture_for_support';
  }
}

// IMEI Validation Service
class IMEIValidationService {
  async validateIMEIForRegistration(imei: string, userId?: string): Promise<ValidationResult> {
    const checks = [
      this.validateFormat(imei),
      this.validateLuhn(imei),
      this.checkDuplicateIMEI(imei, userId)
    ];

    const results = await Promise.all(checks);
    return this.compileResults(results);
  }

  private async checkDuplicateIMEI(imei: string, excludeUserId?: string): Promise<ValidationCheck> {
    const existingUser = await prisma.user.findFirst({
      where: {
        imeiNumber: imei,
        NOT: { id: excludeUserId }
      }
    });

    return {
      valid: !existingUser,
      message: existingUser ? 'IMEI already registered to another user' : 'IMEI available'
    };
  }
}

4.2 Polling Station Assignment Logic
interface StationAssignmentLogic {
  // ASSIGNMENT CONSTRAINTS
  constraints: {
    maxStationsPerUser: 10, // Reasonable limit
    samePollingCenter: true, // Stations must be in same center
    geographicProximity: true, // Stations should be physically close
  },

  // ASSIGNMENT VALIDATION
  validation: {
    checkStationAvailability: (stationId: string) => Promise<boolean>;
    checkUserCapacity: (userId: string, newStations: string[]) => Promise<boolean>;
    checkGeographicConsistency: (stationIds: string[]) => Promise<boolean>;
  }
}

// Assignment Service
class StationAssignmentService {
  async assignStationsToUser(userId: string, stationIds: string[], adminId: string) {
    // Validate all stations belong to same polling center
    const stations = await prisma.pollingStation.findMany({
      where: { id: { in: stationIds } }
    });

    const centers = new Set(stations.map(s => s.pollingCenterCode));
    if (centers.size > 1) {
      throw new ValidationError('All stations must be in the same polling center');
    }

    // Check if user exists and is approved
    const user = await prisma.user.findUnique({
      where: { id: userId, registrationStatus: 'approved' }
    });

    if (!user) {
      throw new ValidationError('User not found or not approved');
    }

    // Check if user has IMEI registered
    if (!user.imeiNumber) {
      throw new ValidationError('User must have IMEI registered before station assignment');
    }

    // Create assignments
    const assignments = stationIds.map(stationId => ({
      userId,
      pollingStationId: stationId,
      assignedBy: adminId
    }));

    return await prisma.userPollingStationAssignment.createMany({
      data: assignments
    });
  }
}

5. UPDATED MOBILE APP REGISTRATION FLOW
5.1 Enhanced Registration with IMEI Capture
Screen 1: Mobile Number Input
Kenyan flag + country code preselect

Mobile input with format validation

"Continue" button (enabled after valid input)

Screen 2: OTP Verification
6-digit input boxes with auto-focus

Resend OTP button (disabled for 120s)

Countdown timer display

"Verify" button

Screen 3: Complete Registration with IMEI
interface RegistrationData {
  mobileNumber: string;
  fullName: string;
  nationalId: string;
  email?: string;
  password: string;
  imeiNumber: string;        // CAPTURED HERE
  deviceModel?: string;      // Auto-detected if possible
  osVersion?: string;        // Auto-detected
}

UI Components:

IMEI input field with validation

Device information auto-detection

"Why we need IMEI" explanation

"Complete Registration" button

Screen 4: Pending Approval
Status message indicating IMEI captured

"Pending admin approval" with device info preview

Contact information for inquiries

5.2 IMEI Capture Implementation

// Mobile App IMEI Service
class IMEICaptureService {
  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      // Attempt to auto-detect IMEI (platform-specific)
      const imei = await this.detectIMEI();
      const deviceInfo = await this.getDeviceDetails();

      return {
        imeiNumber: imei,
        deviceModel: deviceInfo.model,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
        autoDetected: true
      };
    } catch (error) {
      // Fallback to manual input
      return {
        imeiNumber: '',
        deviceModel: '',
        osVersion: '',
        appVersion: '',
        autoDetected: false
      };
    }
  }

  validateManualIMEI(imei: string): ValidationResult {
    // 15 digits validation
    if (!/^\d{15}$/.test(imei)) {
      return { valid: false, message: 'IMEI must be 15 digits' };
    }

    // Luhn algorithm validation
    if (!this.luhnCheck(imei)) {
      return { valid: false, message: 'Invalid IMEI format' };
    }

    return { valid: true, message: 'Valid IMEI' };
  }
}

6. UPDATED API ENDPOINTS
6.1 Enhanced Registration Endpoints
// INITIATE REGISTRATION WITH DEVICE INFO
POST /api/v1/auth/register/initiate
Body: {
  mobileNumber: string,
  deviceInfo?: {  // Optional initial device info
    imeiNumber?: string,
    deviceModel?: string,
    osVersion?: string
  }
}
Response: {
  success: boolean,
  requiresManualIMEI: boolean,
  retryAfter?: number
}

// COMPLETE REGISTRATION WITH IMEI
POST /api/v1/auth/register/complete
Body: {
  mobileNumber: string,
  fullName: string,
  nationalId: string,
  email?: string,
  password: string,
  imeiNumber: string,        // MANDATORY
  deviceModel: string,       // MANDATORY
  osVersion: string          // MANDATORY
}
Response: {
  user: User,
  status: 'pending_approval',
  imeiRegistered: true
}

// IMEI VALIDATION ENDPOINT
POST /api/v1/auth/validate-imei
Body: { imeiNumber: string }
Response: {
  valid: boolean,
  available: boolean,
  message: string
}

6.2 Enhanced Admin Endpoints
// GET USER DETAILS WITH IMEI INFO
GET /api/v1/admin/users/:userId/details
Response: {
  user: User,
  deviceInfo: {
    imeiNumber: string,
    deviceModel: string,
    osVersion: string,
    appVersion: string,
    registeredAt: DateTime
  },
  assignments: UserPollingStationAssignment[]
}

// BULK STATION ASSIGNMENT WITH VALIDATION
POST /api/v1/admin/users/:userId/assign-stations
Body: {
  pollingStationIds: string[],
  assignedBy: string,
  validateGeographicConsistency: boolean = true
}
Response: {
  success: boolean,
  assignmentsCreated: number,
  warnings: string[],
  pollingCenter: string // The center where stations were assigned
}

7. ENHANCED SECURITY RULES
7.1 IMEI-Based Authentication

interface IMEIAuthenticationRules {
  // LOGIN VALIDATION
  login: {
    verifyIMEIMatch: true,
    allowMultipleSessions: false,
    sessionPerDevice: true
  },

  // API ACCESS
  api: {
    requireIMEIHeader: true,
    validateDeviceConsistency: true,
    logDeviceMismatch: true
  },

  // DATA SYNC
  sync: {
    validateDeviceBeforeSync: true,
    rejectDataFromUnknownDevices: true
  }
}

// Enhanced Auth Middleware
class DeviceAwareAuthMiddleware {
  async validateRequest(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);
    const deviceIMEI = req.headers['x-device-imei'] as string;

    if (!deviceIMEI) {
      return res.status(401).json({ error: 'Device IMEI required' });
    }

    const user = await this.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // CRITICAL: Verify IMEI matches registered device
    if (user.imeiNumber !== deviceIMEI) {
      await this.logSecurityEvent({
        type: 'device_mismatch',
        userId: user.id,
        expectedIMEI: user.imeiNumber,
        providedIMEI: deviceIMEI,
        ipAddress: req.ip
      });

      return res.status(401).json({ error: 'Device not authorized' });
    }

    req.user = user;
    next();
  }
}

7.2 Business Rule Enforcement
const businessRules = {
  device: {
    ONE_USER_ONE_DEVICE: true,
    IMEI_CAPTURED_AT_REGISTRATION: true,
    NO_DEVICE_CHANGES_WITHOUT_ADMIN: true,
    IMEI_UNIQUE_ACROSS_SYSTEM: true
  },
  assignments: {
    ONE_USER_MULTIPLE_STATIONS: true,
    STATIONS_IN_ONE_CENTER: true,
    REQUIRE_IMEI_BEFORE_ASSIGNMENT: true,
    GEOGRAPHIC_CONSISTENCY: true
  },
  registration: {
    MOBILE_NUMBER_UNIQUE: true,
    NATIONAL_ID_UNIQUE: true,
    IMEI_UNIQUE: true,
    ADMIN_APPROVAL_REQUIRED: true
  }
};

8. ADMIN DASHBOARD ENHANCEMENTS
8.1 User Management with Device Info
User List View:

IMEI number column

Device model information

Registration status with device info

Filter by IMEI status

User Detail View:
interface UserDetailView {
  personalInfo: {
    mobileNumber: string,
    fullName: string,
    nationalId: string,
    email?: string
  },
  deviceInfo: {
    imeiNumber: string,
    deviceModel: string,
    osVersion: string,
    appVersion: string,
    registeredAt: DateTime
  },
  assignmentInfo: {
    pollingCenter: string,
    assignedStations: PollingStation[],
    assignmentCount: number,
    assignmentDate: DateTime
  },
  status: {
    registrationStatus: UserRegistrationStatus,
    submittedAt: DateTime,
    approvedAt?: DateTime,
    lastLogin?: DateTime
  }
}
8.2 Bulk Operations with IMEI Validation
Bulk Approval:

Validate all users have IMEI before approval

Show IMEI status in bulk approval list

Prevent approval of users without IMEI

Bulk Assignment:

Auto-detect polling center from first station

Validate all stations belong to same center

Show geographic consistency warnings

9. ERROR HANDLING & EDGE CASES
9.1 IMEI-Specific Error Scenarios

const imeiErrorScenarios = {
  duplicate_imei: {
    message: 'This device is already registered to another user',
    action: 'contact_support_for_device_transfer',
    severity: 'high'
  },
  invalid_imei: {
    message: 'Invalid IMEI format',
    action: 'check_imei_and_retry',
    severity: 'medium'
  },
  missing_imei: {
    message: 'Device IMEI is required for registration',
    action: 'enable_permissions_or_enter_manually',
    severity: 'high'
  },
  device_mismatch: {
    message: 'You are trying to login from a different device',
    action: 'use_registered_device_or_contact_support',
    severity: 'high'
  }
};

9.2 Recovery Flows for Device Issues
Lost/Stolen Device Process:

User reports lost device to admin via alternative channel

Admin suspends user account and IMEI

Admin verifies user identity through alternative means

Admin updates IMEI for verified user

User can login with new device

Device Replacement Policy:

Maximum 1 device change per election cycle

Requires strong identity verification

All previous sessions are invalidated

Audit trail maintained for device changes

10. SUCCESS METRICS & MONITORING
10.1 Enhanced KPIs
Device Registration Metrics:

IMEI capture success rate (% of registrations with IMEI)

Auto-detection success rate vs manual entry

IMEI validation success rate

Device consistency in logins

Assignment Metrics:

Average stations per user

Polling center consistency rate

Assignment completion rate after approval

Geographic distribution of assignments

10.2 Security Monitoring
Device Security Alerts:

IMEI mismatch attempts

Multiple device registration attempts

Suspicious device changes

Geographic anomalies in device usage

Compliance Monitoring:

Users without IMEI (should be 0 after registration)

Devices without assignments

Assignments without geographic consistency

Admin override activities

11. IMPLEMENTATION PHASING
Phase 1: Core Registration with IMEI
IMEI capture during registration

IMEI validation and duplicate checking

Basic device information storage

Admin approval workflow with IMEI visibility

Phase 2: Station Assignment Logic
Polling center grouping for stations

Geographic consistency validation

Bulk assignment with center validation

User dashboard showing assigned stations

Phase 3: Enhanced Security
IMEI-based API authentication

Device mismatch detection and blocking

Lost device recovery process

Comprehensive audit logging

Phase 4: Optimization & Analytics
Device performance analytics

Assignment optimization algorithms

Advanced reporting for administrators

Mobile app performance monitoring
```
