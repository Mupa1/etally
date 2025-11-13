# Field Observer PWA - Technical Specification & Implementation Guide

📋 Document Overview
**Document Version**: 2.0
**Last Updated**: October 16, 2024
**Status**: ✅ APPROVED - Ready for Implementation
**Module Type**: Progressive Web App (PWA) + Backend API
**Architecture**: Integrated with existing Vue.js frontend
**Backend**: Mobile-optimized endpoints wrapping existing logic
**Priority**: HIGH
**Timeline**: 3-4 weeks (phased implementation)

## 🎯 Executive Summary

The Field Observer PWA is an **offline-first mobile application** that enables field observers to:

1. **Register** as election observers through a public portal
2. **Submit** election results from assigned polling stations
3. **Upload** Form 34A photos and result documentation
4. **Work offline** and sync automatically when connection is restored

### Key Features

✅ **Integrated Architecture**: Part of existing Vue.js frontend (`/mobile/*` routes)
✅ **Offline-First**: IndexedDB + Service Workers + Background Sync
✅ **Unified Role**: ObserverRegistration → User with `field_observer` role
✅ **Mobile-Optimized APIs**: Lightweight endpoints wrapping existing backend logic
✅ **Form 34A Priority**: Photo upload required before or with result submission
✅ **Progressive Enhancement**: Works on all devices, installable on mobile

---

## 🏗️ Architecture & Integration

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Vue.js)                                   │
│  ├── /admin/*     (Existing admin interfaces)       │
│  ├── /elections/* (Existing public views)           │
│  └── /mobile/*    (NEW - Observer PWA routes)       │
│      ├── /mobile/register                           │
│      ├── /mobile/login                              │
│      ├── /mobile/dashboard                          │
│      └── /mobile/submit-results                     │
└─────────────────────────────────────────────────────┘
                      ↓ HTTPS
┌─────────────────────────────────────────────────────┐
│  Backend API (Node.js/Express)                      │
│  ├── /api/v1/*         (Existing endpoints)         │
│  └── /api/mobile/*     (NEW - Mobile-optimized)     │
│      ├── POST /api/mobile/register                  │
│      ├── GET  /api/mobile/stations/assigned         │
│      ├── GET  /api/mobile/sync/data                 │
│      └── POST /api/mobile/results/submit            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  Existing Infrastructure                             │
│  ├── PostgreSQL (Prisma ORM)                        │
│  ├── Redis (Caching)                                │
│  ├── MinIO (File Storage - Form 34A photos)         │
│  └── Audit System (Comprehensive logging)           │
└─────────────────────────────────────────────────────┘
```

### Integration Points

- **Authentication**: Reuses existing JWT + Session management
- **User Model**: Extends existing User with `field_observer` role
- **Database**: Uses existing Prisma schema + new models
- **Storage**: MinIO for Form 34A photos (bucket: `form-34a-photos`)
- **Audit**: Leverages existing AuditLog model
- **Notifications**: Uses existing Notification system

---

## 🎯 User Stories & Requirements

### As a Field Observer

**US-1**: I want to register as an election observer through a **public mobile-friendly portal**

- No authentication required for registration
- Simple multi-step form
- Upload national ID and profile photo
- Receive confirmation email with application tracking number

**US-2**: I want to **set up my password** after admin approval

- Receive email with secure setup link
- Create strong password
- Login and access my dashboard

**US-3**: I want to **submit election results offline** from my assigned polling station

- See only my assigned stations
- Enter votes for each candidate
- Work completely offline
- Auto-sync when connection available

**US-4**: I want to **upload Form 34A photos** (highest priority)

- Take photos using device camera
- Upload with or without result data
- Compress images before upload
- Track upload status

**US-5**: I want to see only **relevant contests** for my polling station

- No irrelevant contests shown
- Clear candidate list
- Vote count validation
- Progress tracking

### As an Election Administrator

**US-6**: I want to **review observer applications** efficiently

- List all pending applications
- View uploaded documents
- Approve/reject with notes
- Bulk operations support

**US-7**: I want to **assign polling stations** to approved observers

- Geographic validation
- Prevent duplicate assignments
- Track assignment coverage
- View station-observer mapping

**US-8**: I want to **monitor result submissions** in real-time

- See which stations have reported
- Identify missing stations
- Verify Form 34A photo uploads
- Track submission timestamps

---

## 📊 Functional Requirements & Implementation

### Phase 1: Field Observer Registration (Week 1)

#### FR-1.1: Public Registration Portal

**FR-1.1.1**: Mobile-responsive registration form

- **Route**: `/mobile/register`
- **No authentication required**
- **Multi-step wizard**: Personal Info → Document Upload → Confirmation
- **Client-side validation** before submission

**FR-1.1.2**: Personal Information Collection

```typescript
interface RegistrationForm {
  // Personal Details
  firstName: string; // Required, 2-100 chars
  lastName: string; // Required, 2-100 chars
  nationalId: string; // Required, 7-8 digits, unique
  dateOfBirth: Date; // Required, must be 18+ years

  // Contact Information
  phoneNumber: string; // Required, format: +254XXXXXXXXX or 07XXXXXXXX
  email: string; // Required, valid email, unique

  // Preferred Assignment
  preferredCountyId?: string;
  preferredConstituencyId?: string;
  preferredWardId?: string;
  preferredStationId?: string;

  // Consent
  termsAccepted: boolean; // Required, must be true
  dataProcessingConsent: boolean; // Required, must be true
}
```

**Validation Rules**:

- National ID: Must not already exist in system
- Email: Must not already exist in system
- Age: Must be 18+ years old on election date
- Phone: Valid Kenyan format
- All required fields must be filled

**FR-1.1.3**: Document Upload

- **National ID Photo** (Required):
  - Front and back
  - Formats: JPG, PNG
  - Max size: 5MB each
  - Client-side compression to 1920x1080 max
- **Profile Photo** (Required):
  - Recent photo
  - Formats: JPG, PNG
  - Max size: 2MB
  - Client-side compression to 800x800 max

**Storage**: MinIO bucket `observer-documents/{nationalId}/`

**FR-1.1.4**: Registration Confirmation

- Generate unique tracking number (format: `OBS-YYYY-XXXXXX`)
- Send confirmation email with tracking number
- Display success page with next steps
- Status: `pending_review`

#### FR-1.2: Application Tracking

**FR-1.2.1**: Public tracking endpoint

- **Route**: `/mobile/track/{trackingNumber}`
- **No authentication required**
- Display application status
- Show estimated review time
- Next steps information

---

### Phase 2: Admin Review & Approval (Week 2)

#### FR-2.1: Admin Review Interface

**FR-2.1.1**: Observer Applications Dashboard

- **Route**: `/admin/observers/applications`
- **Permissions**: `super_admin`, `election_manager`

**Features**:

- Filterable table (status, date, location)
- Search by name, national ID, email
- Bulk selection for mass operations
- Export to CSV

**FR-2.1.2**: Application Detail View

```typescript
interface ApplicationView {
  // Observer Details
  personalInfo: RegistrationForm;

  // Documents
  nationalIdFront: string; // Presigned URL
  nationalIdBack: string; // Presigned URL
  profilePhoto: string; // Presigned URL

  // Status
  currentStatus: ObserverStatus;
  submissionDate: Date;
  reviewDate?: Date;
  reviewedBy?: User;
  reviewNotes?: string;

  // Actions
  availableActions: ('approve' | 'reject' | 'request_clarification')[];
}
```

**FR-2.1.3**: Review Actions

- **Approve**: Change status to `approved`, send password setup email
- **Reject**: Change status to `rejected`, send rejection email with reason
- **Request Clarification**: Send email requesting additional information

#### FR-2.2: Polling Station Assignment

**FR-2.2.1**: Assignment Interface

- **Route**: `/admin/observers/{observerId}/assign-stations`
- **Permissions**: `super_admin`, `election_manager`

**Features**:

- Geographic drill-down: County → Constituency → Ward → Station
- Multiple station assignment
- Preferred station highlighting
- Assignment conflict detection
- Coverage map view

**FR-2.2.2**: Assignment Validation

```typescript
async function validateAssignment(observerId: string, stationId: string) {
  // Check 1: Observer is approved
  const observer = await getObserver(observerId);
  if (observer.status !== 'approved' && observer.status !== 'active') {
    throw new ValidationError('Observer must be approved');
  }

  // Check 2: Station exists and is active
  const station = await getPollingStation(stationId);
  if (!station.isActive) {
    throw new ValidationError('Polling station is not active');
  }

  // Check 3: No duplicate assignment
  const existing = await getAssignment(observerId, stationId);
  if (existing && existing.isActive) {
    throw new ValidationError('Observer already assigned to this station');
  }

  // Check 4: Geographic proximity (optional warning)
  if (observer.preferredStationId) {
    const distance = calculateDistance(
      station.coordinates,
      observer.preferredStation.coordinates
    );
    if (distance > 50000) {
      // 50km
      console.warn('Assignment is far from preferred location');
    }
  }
}
```

#### FR-2.3: Password Setup Flow

**FR-2.3.1**: Generate setup link on approval

```typescript
async function approveObserverApplication(
  applicationId: string,
  adminUserId: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Update application status
    const application = await tx.observerRegistration.update({
      where: { id: applicationId },
      data: {
        status: 'approved',
        reviewDate: new Date(),
        reviewedBy: adminUserId,
      },
    });

    // 2. Create User account with field_observer role
    const user = await tx.user.create({
      data: {
        nationalId: application.nationalId,
        email: application.email,
        phoneNumber: application.phoneNumber,
        firstName: application.firstName,
        lastName: application.lastName,
        role: 'field_observer',
        isActive: false, // Will activate after password setup
        passwordHash: '', // Will be set during password setup
      },
    });

    // 3. Link application to user
    await tx.observerRegistration.update({
      where: { id: applicationId },
      data: { userId: user.id },
    });

    // 4. Generate password setup token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await tx.passwordSetupToken.create({
      data: {
        token: setupToken,
        userId: user.id,
        expiresAt: expiry,
      },
    });

    // 5. Send setup email
    await sendPasswordSetupEmail(user.email, setupToken);

    // 6. Create audit log
    await tx.auditLog.create({
      data: {
        action: 'create',
        entityType: 'observer_approval',
        entityId: applicationId,
        userId: adminUserId,
        newValues: { status: 'approved', userId: user.id },
      },
    });

    return { user, setupToken };
  });
}
```

**FR-2.3.2**: Password Setup Page

- **Route**: `/mobile/setup-password/{token}`
- **Validates token** (not expired, not used)
- **Password requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Confirms password** (must match)
- **Activates user account** on success
- **Sends welcome email**

---

### Phase 3: Result Reporting PWA (Week 3)

> 📱 **See also**: [MOBILE_STRATEGY.md](../election-management/MOBILE_STRATEGY.md) for detailed PWA offline implementation

#### FR-3.1: Observer Dashboard

**FR-3.1.1**: Dashboard Overview

- **Route**: `/mobile/dashboard`
- **Authentication Required**: JWT token

**Display**:

- Observer name and profile photo
- List of assigned polling stations
- Active elections
- Quick action buttons
- Pending submissions count
- Sync status indicator

**FR-3.1.2**: Assigned Stations List

```typescript
interface AssignedStationView {
  pollingStation: {
    id: string;
    code: string;
    name: string;
    ward: string;
    constituency: string;
    county: string;
    registeredVoters: number;
    latitude: number;
    longitude: number;
  };
  assignmentDate: Date;
  resultsSubmitted: boolean;
  form34AUploaded: boolean;
  lastSubmissionDate?: Date;
}
```

#### FR-3.2: Result Submission Interface

**FR-3.2.1**: Station Selection

- Show only assigned stations
- Display station details
- Show submission status (completed/pending)
- Filter by active elections

**FR-3.2.2**: Contest List for Station

```typescript
// Mobile-optimized endpoint
GET /api/mobile/stations/{stationId}/contests

Response:
{
  pollingStation: {
    id: string;
    name: string;
    code: string;
    registeredVoters: number;
  },
  activeElection: {
    id: string;
    title: string;
    electionDate: Date;
  },
  contests: [
    {
      id: string;
      positionName: string;
      contestType: ContestType;
      candidates: [
        {
          id: string;
          fullName: string;
          candidateNumber: number;
          party: {
            name: string;
            acronym: string;
            logoUrl: string;
          }
        }
      ]
    }
  ]
}
```

**FR-3.2.3**: Vote Entry Form

```typescript
interface ResultSubmission {
  electionId: string;
  pollingStationId: string;
  contests: [
    {
      contestId: string;
      results: [
        {
          candidateId: string;
          votes: number;
        }
      ];
      rejectedBallots: number;
      spoiltBallots: number;
    }
  ];

  // Form 34A Details
  form34ANumber?: string;
  form34APhotos?: string[]; // Base64 or blob URLs for offline

  // Metadata
  submittedAt: Date;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  deviceId: string;
}
```

**Validation Rules**:

- Total votes (all candidates + rejected + spoilt) <= registered voters
- All votes >= 0
- At least one candidate must have votes > 0
- Form 34A number format validation
- GPS coordinates required (accuracy < 100m preferred)

**FR-3.2.4**: Form 34A Photo Upload

**Priority**: Form 34A photos are **highest priority**

**Options**:

1. **Upload with results** (recommended flow)
2. **Upload separately** (if photo upload fails)

**Features**:

- Camera capture (HTML5 `capture="environment"`)
- File picker (for existing photos)
- Multiple photos per station (up to 5)
- Client-side image compression (max 1920x1080, JPEG quality 85%)
- Progress indicator during upload
- Retry mechanism for failed uploads

**Storage**:

```typescript
// MinIO structure
form-34a-photos/
  ├── {electionId}/
  │   ├── {pollingStationId}/
  │   │   ├── {timestamp}-1.jpg
  │   │   ├── {timestamp}-2.jpg
  │   │   └── ...
```

#### FR-3.3: Offline-First Implementation

**See**: [MOBILE_STRATEGY.md](../election-management/MOBILE_STRATEGY.md) for complete implementation

**Key Features**:

- **IndexedDB Storage**: Unlimited local storage for pending submissions
- **Service Worker**: Cache static assets, enable offline mode
- **Background Sync**: Auto-sync when connection restored
- **Manual Sync**: Button to trigger sync manually
- **Conflict Resolution**: Server timestamp wins

**Offline Data Cached**:

```typescript
// Data to sync on login and cache locally
interface OfflineDataPackage {
  observer: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
  };
  assignedStations: AssignedStationView[];
  activeElections: Election[];
  contests: ElectionContest[];
  candidates: Candidate[];
  parties: PoliticalParty[];
  syncTimestamp: Date;
}
```

**Sync Strategy**:

1. **On Login**: Download complete data package (one-time or daily)
2. **Periodic Refresh**: Check for updates every 6 hours
3. **On Submit**: Try immediate sync, queue if offline
4. **Background Sync**: Auto-sync pending submissions when online

---

## 💾 Data Models & Database Schema

### New Models

#### ObserverRegistration

```prisma
model ObserverRegistration {
  id String @id @default(uuid())

  // Personal Information
  nationalId      String   @unique
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  phoneNumber     String
  email           String   @unique

  // Preferred Assignment
  preferredCountyId       String?
  preferredCounty         County?          @relation(fields: [preferredCountyId], references: [id])
  preferredConstituencyId String?
  preferredConstituency   Constituency?    @relation(fields: [preferredConstituencyId], references: [id])
  preferredWardId         String?
  preferredWard           ElectoralWard?   @relation(fields: [preferredWardId], references: [id])
  preferredStationId      String?
  preferredStation        PollingStation?  @relation(fields: [preferredStationId], references: [id])

  // Documents (MinIO paths)
  nationalIdFrontUrl String?
  nationalIdBackUrl  String?
  profilePhotoUrl    String?
  additionalDocs     String[] // JSON array of MinIO paths

  // Application Status
  status          ObserverStatus @default(pending_review)
  trackingNumber  String         @unique
  submissionDate  DateTime       @default(now())

  // Review Information
  reviewDate      DateTime?
  reviewedBy      String?
  reviewer        User?          @relation("ReviewedApplications", fields: [reviewedBy], references: [id])
  reviewNotes     String?
  rejectionReason String?

  // User Link (created on approval)
  userId          String?        @unique
  user            User?          @relation("ObserverProfile", fields: [userId], references: [id])

  // Consent
  termsAccepted           Boolean @default(false)
  dataProcessingConsent   Boolean @default(false)

  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  assignments ObserverAssignment[]

  @@index([nationalId])
  @@index([email])
  @@index([status])
  @@index([trackingNumber])
  @@index([submissionDate])
  @@map("observer_registrations")
}
```

#### ObserverAssignment

```prisma
model ObserverAssignment {
  id String @id @default(uuid())

  // Observer (via registration)
  observerRegistrationId String
  observerRegistration   ObserverRegistration @relation(fields: [observerRegistrationId], references: [id], onDelete: Cascade)

  // Polling Station
  pollingStationId String
  pollingStation   PollingStation @relation(fields: [pollingStationId], references: [id])

  // Assignment Details
  assignmentDate DateTime @default(now())
  assignedBy     String
  assigner       User     @relation("AssignedObservers", fields: [assignedBy], references: [id])

  // Status
  isActive       Boolean  @default(true)
  deactivatedAt  DateTime?
  deactivatedBy  String?
  deactivationReason String?

  // Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([observerRegistrationId, pollingStationId])
  @@index([pollingStationId])
  @@index([isActive])
  @@map("observer_assignments")
}
```

#### PasswordSetupToken

```prisma
model PasswordSetupToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
  @@map("password_setup_tokens")
}
```

### Enhanced Existing Models

#### User Model Enhancement

```prisma
model User {
  // ... existing fields ...

  // NEW: Observer Relations
  observerProfile       ObserverRegistration?  @relation("ObserverProfile")
  reviewedApplications  ObserverRegistration[] @relation("ReviewedApplications")
  assignedObservers     ObserverAssignment[]   @relation("AssignedObservers")
  passwordSetupTokens   PasswordSetupToken[]
}
```

#### PollingStation Enhancement

```prisma
model PollingStation {
  // ... existing fields ...

  // NEW: Observer Relations
  preferredByObservers  ObserverRegistration[]
  observerAssignments   ObserverAssignment[]
}
```

#### ElectionResult Enhancement

```prisma
model ElectionResult {
  // ... existing fields ...

  // NEW: Form 34A Tracking
  form34ANumber      String?
  form34APhotos      String[]  // Array of MinIO paths
  form34AUploadedAt  DateTime?

  // NEW: Observer Submission Flag
  submittedViaObserverApp Boolean @default(false)

  @@index([form34ANumber])
  @@index([submittedViaObserverApp])
}
```

### New Enums

```prisma
enum ObserverStatus {
  pending_review    // Initial status after registration
  approved          // Admin approved, awaiting password setup
  active            // Password set, can login and submit
  rejected          // Application rejected
  suspended         // Temporarily suspended
  inactive          // Deactivated
}
```

---

## 🔌 Mobile API Endpoints

### Public Endpoints (No Auth Required)

#### POST /api/mobile/register

Register new field observer

**Request**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "nationalId": "12345678",
  "dateOfBirth": "1990-01-15",
  "phoneNumber": "+254712345678",
  "email": "john.doe@example.com",
  "preferredCountyId": "uuid",
  "preferredStationId": "uuid",
  "termsAccepted": true,
  "dataProcessingConsent": true
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "trackingNumber": "OBS-2024-001234",
  "message": "Application submitted successfully",
  "nextSteps": "You will receive an SMS when your application is reviewed"
}
```

#### GET /api/mobile/track/:trackingNumber

Track application status

**Response** (200 OK):

```json
{
  "trackingNumber": "OBS-2024-001234",
  "status": "approved",
  "submissionDate": "2024-10-15T10:30:00Z",
  "reviewDate": "2024-10-16T14:20:00Z",
  "statusMessage": "Your application has been approved. Check your email for password setup link.",
  "estimatedReviewTime": "24-48 hours"
}
```

#### POST /api/mobile/setup-password

Set password after approval

**Request**:

```json
{
  "token": "setup-token-from-email",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Password set successfully. You can now login.",
  "loginUrl": "/mobile/login"
}
```

### Observer Endpoints (Auth Required - field_observer role)

#### GET /api/mobile/sync/data

Get complete offline data package

**Headers**: `Authorization: Bearer {jwt-token}`

**Response** (200 OK):

```json
{
  "observer": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "photoUrl": "https://minio/observer-documents/..."
  },
  "assignedStations": [
    {
      "pollingStation": {
        "id": "uuid",
        "code": "PS-001-001-001-001",
        "name": "Port Reitz Primary School",
        "ward": "Port Reitz",
        "constituency": "Changamwe",
        "county": "Mombasa",
        "registeredVoters": 1500,
        "latitude": -4.0435,
        "longitude": 39.6682
      },
      "assignmentDate": "2024-10-10T09:00:00Z",
      "resultsSubmitted": false,
      "form34AUploaded": false
    }
  ],
  "activeElections": [
    {
      "id": "uuid",
      "title": "2027 General Election",
      "electionDate": "2027-08-08",
      "status": "active"
    }
  ],
  "contests": [...],
  "candidates": [...],
  "parties": [...],
  "syncTimestamp": "2024-10-16T12:00:00Z"
}
```

#### GET /api/mobile/stations/assigned

Get assigned polling stations (lightweight)

**Response** (200 OK):

```json
{
  "stations": [
    {
      "id": "uuid",
      "code": "PS-001-001-001-001",
      "name": "Port Reitz Primary School",
      "location": "Port Reitz Ward, Changamwe",
      "registeredVoters": 1500,
      "submissionStatus": {
        "resultsSubmitted": false,
        "form34AUploaded": false,
        "lastUpdate": null
      }
    }
  ],
  "totalAssigned": 1,
  "withResults": 0,
  "withForm34A": 0
}
```

#### GET /api/mobile/stations/:stationId/contests

Get contests and candidates for station

**Response** (200 OK):

```json
{
  "pollingStation": {
    "id": "uuid",
    "name": "Port Reitz Primary School",
    "code": "PS-001-001-001-001",
    "registeredVoters": 1500
  },
  "activeElection": {
    "id": "uuid",
    "title": "2027 General Election"
  },
  "contests": [
    {
      "id": "uuid",
      "positionName": "President",
      "contestType": "presidential",
      "candidates": [
        {
          "id": "uuid",
          "fullName": "Candidate A",
          "candidateNumber": 1,
          "party": {
            "name": "Party ODM",
            "acronym": "ODM",
            "logoUrl": "https://minio/..."
          }
        }
      ]
    }
  ]
}
```

#### POST /api/mobile/results/submit

Submit results with or without Form 34A

**Request**:

```json
{
  "electionId": "uuid",
  "pollingStationId": "uuid",
  "contests": [
    {
      "contestId": "uuid",
      "results": [
        {
          "candidateId": "uuid",
          "votes": 450
        },
        {
          "candidateId": "uuid",
          "votes": 380
        }
      ],
      "rejectedBallots": 10,
      "spoiltBallots": 5
    }
  ],
  "form34ANumber": "FORM-2027-001",
  "form34APhotos": ["base64-encoded-image-1", "base64-encoded-image-2"],
  "latitude": -4.0435,
  "longitude": 39.6682,
  "accuracyMeters": 25,
  "deviceId": "device-uuid",
  "submittedAt": "2024-08-08T18:30:00Z"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "submissionId": "uuid",
  "message": "Results submitted successfully",
  "form34AUploaded": true,
  "photosUploaded": 2,
  "timestamp": "2024-08-08T18:30:15Z"
}
```

#### POST /api/mobile/form34a/upload

Upload Form 34A separately (if initial submission failed)

**Request** (multipart/form-data):

```
electionId: uuid
pollingStationId: uuid
form34ANumber: FORM-2027-001
photos: [File, File, ...]
```

**Response** (200 OK):

```json
{
  "success": true,
  "photosUploaded": 2,
  "message": "Form 34A photos uploaded successfully"
}
```

#### GET /api/mobile/submissions/history

Get submission history

**Response** (200 OK):

```json
{
  "submissions": [
    {
      "id": "uuid",
      "pollingStation": "Port Reitz Primary School",
      "election": "2027 General Election",
      "submittedAt": "2024-08-08T18:30:00Z",
      "contestsReported": 6,
      "form34AUploaded": true,
      "status": "verified"
    }
  ],
  "totalSubmissions": 1
}
```

---

## 📅 Implementation Roadmap

### Phase 1: Observer Registration (Week 1)

**Backend Tasks**:

- [ ] Day 1-2: Create database models (ObserverRegistration, PasswordSetupToken)
- [ ] Day 3: Implement registration API endpoint
- [ ] Day 4: Implement document upload to MinIO
- [ ] Day 5: Implement email notification system
- [ ] Day 6: Implement password setup endpoint
- [ ] Day 7: Testing and bug fixes

**Frontend Tasks**:

- [ ] Day 1-2: Create registration form component (multi-step)
- [ ] Day 3: Implement document upload UI with preview
- [ ] Day 4: Create tracking page
- [ ] Day 5: Create password setup page
- [ ] Day 6: Mobile responsive styling
- [ ] Day 7: Testing and bug fixes

**Success Criteria**:

- ✅ Public can register without authentication
- ✅ Documents upload to MinIO successfully
- ✅ Confirmation email sent with tracking number
- ✅ Password setup link works
- ✅ User account created with field_observer role

---

### Phase 2: Admin Review & Assignment (Week 2)

**Backend Tasks**:

- [ ] Day 1-2: Create ObserverAssignment model
- [ ] Day 3: Implement admin review endpoints
- [ ] Day 4: Implement station assignment endpoints
- [ ] Day 5: Implement approval workflow
- [ ] Day 6-7: Testing and bug fixes

**Frontend Tasks**:

- [ ] Day 1-2: Create admin applications list view
- [ ] Day 3: Create application detail modal
- [ ] Day 4: Create station assignment interface
- [ ] Day 5: Create assignment coverage dashboard
- [ ] Day 6-7: Testing and bug fixes

**Success Criteria**:

- ✅ Admin can view all applications
- ✅ Admin can approve/reject applications
- ✅ Admin can assign polling stations
- ✅ Observer receives email on approval
- ✅ Assignment conflicts prevented

---

### Phase 3: Result Reporting PWA (Week 3)

**Backend Tasks**:

- [ ] Day 1: Create mobile sync endpoint
- [ ] Day 2: Create result submission endpoint
- [ ] Day 3: Implement Form 34A photo upload
- [ ] Day 4: Implement offline sync handler
- [ ] Day 5-7: Testing and optimization

**Frontend Tasks**:

- [ ] Day 1: Setup PWA infrastructure (Service Worker, manifest.json)
- [ ] Day 2: Create observer dashboard
- [ ] Day 3: Create result submission form
- [ ] Day 4: Implement IndexedDB storage
- [ ] Day 5: Implement offline sync
- [ ] Day 6: Create photo upload UI
- [ ] Day 7: Testing on real devices

**Success Criteria**:

- ✅ PWA installable on mobile devices
- ✅ Works completely offline
- ✅ Auto-syncs when online
- ✅ Form 34A photos upload successfully
- ✅ Results validation works
- ✅ GPS location captured

---

### Phase 4: Testing & Production (Week 4)

**Tasks**:

- [ ] Day 1-2: End-to-end testing
- [ ] Day 3: Performance testing (offline, slow network)
- [ ] Day 4: Security testing
- [ ] Day 5: Load testing (multiple observers)
- [ ] Day 6: User acceptance testing
- [ ] Day 7: Production deployment

**Success Criteria**:

- ✅ All tests passing
- ✅ Performance acceptable on 3G
- ✅ Security audit passed
- ✅ User feedback incorporated
- ✅ Production deployment successful

---

## 🧪 Testing Requirements

### Functional Testing

- [ ] Complete registration flow (public → approved → password set → login)
- [ ] Document upload and retrieval
- [ ] Admin review and approval workflow
- [ ] Station assignment (single and bulk)
- [ ] Offline result submission
- [ ] Form 34A photo upload (with and without results)
- [ ] Sync when connection restored

### Security Testing

- [ ] Public registration rate limiting
- [ ] Document upload security (virus scan, file type validation)
- [ ] Password setup token expiry
- [ ] Observer data isolation (can only see assigned stations)
- [ ] Result submission authorization
- [ ] PII encryption verification

### Performance Testing

- [ ] PWA load time on 3G (target: < 3 seconds)
- [ ] Offline data sync reliability (target: > 99%)
- [ ] Form submission with large photos (target: < 30 seconds)
- [ ] IndexedDB storage limits (test with 100+ stations)
- [ ] Concurrent observer registrations (50+ simultaneous)

### Device Testing

- [ ] iOS Safari (iPhone 12+)
- [ ] Android Chrome (Android 10+)
- [ ] Low-end devices (2GB RAM)
- [ ] Various screen sizes (320px - 428px width)
- [ ] Slow network (2G, 3G, intermittent)

---

## 📈 Success Metrics

### Registration Metrics

- Registration completion rate: > 95%
- Average review time: < 24 hours
- Password setup completion: > 90%
- Registration rejection rate: < 5%

### Technical Metrics

- PWA Lighthouse score: > 90
- Offline sync success rate: > 99%
- Form 34A upload success rate: > 98%
- API response time (p95): < 500ms

### User Satisfaction

- Observer ease-of-use rating: > 4/5
- Admin management rating: > 4/5
- Support tickets: < 5% of observers

---

## 🛡️ Risk Management

### High Risks

**Risk 1**: Offline Data Loss

- **Mitigation**: Robust IndexedDB, background sync, manual sync button, local backups

**Risk 2**: Photo Upload Failures

- **Mitigation**: Separate upload option, retry mechanism, compression, progress tracking

**Risk 3**: Public Registration Abuse

- **Mitigation**: Rate limiting, CAPTCHA, manual review, duplicate detection

### Medium Risks

**Risk 4**: Device Compatibility

- **Mitigation**: Progressive enhancement, extensive device testing, fallbacks

**Risk 5**: Network Connectivity

- **Mitigation**: Offline-first design, clear status indicators, manual sync

---

**Last Updated**: October 16, 2024
**Status**: ✅ APPROVED - Ready for Phase 1 Implementation
**Next Review**: Post-Phase 1 Completion
