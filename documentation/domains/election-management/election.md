Election Management Module - Technical Specification & Implementation Guide
📋 Document Overview
Document Version: 2.0
Last Updated: October 16, 2024
Status: ✅ REVIEWED & APPROVED - Production Ready
Module Type: Core Module with Advanced Features
Architecture: Hybrid Database (Prisma ORM + Raw PostgreSQL)
Security: UUID-based, RLS-enabled, Audit-first Design

🎯 Executive Summary
The Election Management Module is a comprehensive subsystem designed to handle the complete electoral process within an existing application framework. This module will manage elections, candidate nominations, party coalitions, and results while integrating seamlessly with existing user management, geographic data, and audit systems.

Key Capabilities
✅ Election Lifecycle Management: Complete workflow from setup to results certification
✅ Candidate Nomination Workflow: Digital application with automated approval process
✅ Party Coalition Management: Support for Kenyan political alliances and contest allocations
✅ Geographic Contest Scoping: PostGIS-powered precise electoral area mapping
✅ Advanced Security: ABAC + Row-Level Security (RLS) + Audit trails
✅ High Performance: Table partitioning, materialized views, Redis caching
✅ Mobile-First: Offline-capable result submission with sync capabilities
✅ Real-time Results: Live aggregation with tamper-evident hashing

🏗️ Architecture & Technical Foundation

## Database Architecture

**Strategy**: Hybrid Approach (Prisma ORM + Raw PostgreSQL)

- **Primary Keys**: UUID-based for all tables (security-first design)
- **ORM**: Prisma for CRUD operations and type safety
- **Advanced Features**: Raw PostgreSQL for partitioning, RLS, materialized views
- **Extensions**: PostGIS (spatial), pgcrypto (encryption), uuid-ossp, pg_stat_statements

## Performance Optimizations

**Table Partitioning**:

- `elections` table: RANGE partitioned by election_date (yearly)
- `election_results` table: HASH partitioned by election_id (10 partitions)
- `audit_logs` table: RANGE partitioned by created_at (monthly with auto-creation)

**Materialized Views**:

- `election_summary_view`: Pre-aggregated election statistics
- `live_results_view`: Real-time results with candidate/party joins
- Auto-refresh triggers on result updates

**Spatial Indexing**:

- PostGIS geography columns for lat/long validation
- GIST indexes for geographic proximity queries
- Automatic location validation for mobile submissions

**Caching Strategy**:

- Redis caching for election results (5-minute TTL)
- Cache invalidation on result submissions
- Pattern-based cache clearing (election:\*:results)

## Security Architecture

**Row-Level Security (RLS)**:

- Database-level access control via `auth.uid()` function
- User context set per transaction
- Automatic filtering based on user role and geographic scope

**Audit Trail**:

- Comprehensive logging with GPS coordinates
- Old/new value tracking for all mutations
- Request correlation IDs for tracing
- Tamper-evident audit signatures

**Data Protection**:

- Field-level encryption for sensitive PII
- Encrypted file storage in MinIO
- JWT tokens with 15-minute expiry
- Refresh token rotation in database sessions

## Core Dependencies

```
PostgreSQL 15+ (PostGIS)
      ↓
   PgBouncer (Connection Pooling)
      ↓
   Prisma ORM ←→ Raw SQL
      ↓
┌─────────────────────────────────────┐
│  Election Management Module         │
│  - Elections                         │
│  - Contests                          │
│  - Candidates                        │
│  - Results                           │
│  - Nominations                       │
│  - Coalitions                        │
└─────────────────────────────────────┘
      ↓
Integrations:
- User Management (existing)
- Geographic Hierarchy (County → Ward)
- ABAC Authorization
- MinIO (S3-compatible storage)
- Redis (Caching + Rate Limiting)
- Audit System
```

📊 Functional Requirements & Implementation

## 1. Election Setup & Configuration

### 1.1 Election Creation

**FR-1.1.1**: Create elections with complete metadata

- **Implementation**: Prisma ORM with automatic partition creation
- **Fields**: id (UUID), electionCode (unique), title, electionType, electionDate, status
- **Audit**: Full audit trail via AuditLog model
- **Validation**: Unique electionCode, future electionDate for new elections
- **API**: `POST /api/v1/elections` (requires: super_admin, election_manager)

**FR-1.1.2**: Configure critical dates

- **Fields**: electionDate, nominationOpenDate, nominationCloseDate, resultsPublishDate
- **Validation**: Logical date sequence (nomination before election)
- **Timezone**: UTC storage with Kenya timezone (EAT) display

**FR-1.1.3**: Election type support

- **Enum**: ElectionType { general_election, by_election, referendum }
- **Constraints**: Type determines available contest types
- **Workflow**: Draft → Scheduled → Active → Completed/Cancelled

**FR-1.1.4**: Party nomination deadlines

- **New Field**: partyListDeadline (DateTime)
- **Validation**: Must be before nominationCloseDate
- **Notifications**: Automated reminders to party officials

### 1.2 Contest Management

**FR-1.2.1**: Six contest types with geographic scoping

```typescript
enum ContestType {
  presidential        // Geographic scope: National (no county/constituency)
  gubernatorial       // Geographic scope: County (required)
  senatorial         // Geographic scope: County (required)
  womens_representative // Geographic scope: County (required)
  national_assembly  // Geographic scope: Constituency (required)
  county_assembly    // Geographic scope: Ward (required)
}
```

**Implementation Details**:

- **Database**: ElectionContest table with contestType, countyId, constituencyId, wardId
- **Validation**: Geographic scope matches contest type
- **Constraints**:
  ```sql
  CHECK (
    (contestType = 'presidential' AND countyId IS NULL) OR
    (contestType IN ('gubernatorial', 'senatorial', 'womens_representative')
     AND countyId IS NOT NULL) OR
    (contestType = 'national_assembly' AND constituencyId IS NOT NULL) OR
    (contestType = 'county_assembly' AND wardId IS NOT NULL)
  )
  ```

**FR-1.2.2**: Geographic scope assignment

- **PostGIS Validation**: Ensure constituency belongs to county, ward to constituency
- **Automatic**: County derived from constituency/ward if not specified
- **Query Optimization**: Spatial indexes on geographic relationships

**FR-1.2.3**: Contest ordering and visibility

- **Field**: orderIndex (Int, default: 0)
- **Display**: Presidential first (1), then gubernatorial (2), etc.
- **Public API**: Only show contests where status = 'active'

## 2. Candidate Nomination System

### 2.1 Application Workflow

**FR-2.1.1**: Digital application submission

- **Model**: CandidateApplication (new)

```prisma
model CandidateApplication {
  id                String            @id @default(uuid())
  electionId        String
  contestId         String
  applicantUserId   String?           // Optional link to User

  // Personal Information (PII - encrypted at rest)
  nationalId        String
  fullName          String
  dateOfBirth       DateTime
  gender            Gender
  phoneNumber       String
  email             String

  // Political Affiliation
  partyId           String?
  isIndependent     Boolean           @default(false)
  nominationType    NominationType

  // Geographic validation
  countyId          String?
  constituencyId    String?
  wardId            String?

  // Application Status
  status            ApplicationStatus @default(draft)
  submittedAt       DateTime?
  reviewedBy        String?
  reviewedAt        DateTime?
  reviewNotes       String?

  // Document Management
  documents         ApplicationDocument[]

  // Audit trail
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@unique([electionId, contestId, nationalId])
  @@index([status, submittedAt])
}
```

**FR-2.1.2**: PII Protection

- **Encryption**: Field-level encryption for nationalId, dateOfBirth
- **Storage**: pgcrypto extension for database-level encryption
- **Access**: Restricted to election_manager, super_admin roles
- **GDPR**: Right to deletion after election certification

**FR-2.1.3**: Document upload system

- **Storage**: MinIO (S3-compatible) with bucket: `candidate-applications`
- **Types**: National ID, academic certificates, party nomination letter, photos
- **Validation**: File type (PDF, JPG, PNG), max size (5MB), virus scanning
- **Model**:

```prisma
model ApplicationDocument {
  id                 String                @id @default(uuid())
  applicationId      String
  application        CandidateApplication  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  documentType       String                // "national_id", "certificate", "nomination_letter", "photo"
  fileName           String
  filePath           String                // MinIO path
  fileSize           BigInt
  mimeType           String

  uploadedAt         DateTime              @default(now())
  verifiedAt         DateTime?
  verifiedBy         String?
}
```

**FR-2.1.4**: Party affiliation selection

- **Validation**: Either partyId OR isIndependent (not both)
- **Coalition Support**: Party can be part of coalition
- **Verification**: Automated check against registered parties

**FR-2.1.5**: Geographic validation with PostGIS

```typescript
// Validation logic
async validateGeographicScope(contestType, countyId, constituencyId, wardId) {
  switch(contestType) {
    case 'presidential':
      return !countyId && !constituencyId && !wardId;
    case 'gubernatorial':
    case 'senatorial':
    case 'womens_representative':
      return countyId && !constituencyId && !wardId;
    case 'national_assembly':
      // Validate constituency belongs to county
      return await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM constituencies
          WHERE id = ${constituencyId}
          AND county_id = ${countyId}
        )`;
    case 'county_assembly':
      // Validate ward → constituency → county chain
      return await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM electoral_wards w
          JOIN constituencies c ON w.constituency_id = c.id
          WHERE w.id = ${wardId}
          AND c.id = ${constituencyId}
          AND c.county_id = ${countyId}
        )`;
  }
}
```

### 2.2 Application Review

**FR-2.2.1**: Status workflow with state machine

```typescript
enum ApplicationStatus {
  draft             // Editable by applicant
  submitted         // Ready for review, immutable
  under_review      // Assigned to reviewer
  approved          // Creates Candidate record
  rejected          // Terminal state with reason
  withdrawn         // Applicant-initiated cancellation
}
```

- **Transitions**: Enforced at application level
- **Audit**: Every status change logged in AuditLog
- **Notifications**: Automated email/SMS on status changes

**FR-2.2.2**: Reviewer assignment

- **Role**: Only election_manager can review
- **Workload**: Automated assignment based on reviewer load
- **SLA**: 48-hour review target with escalation

**FR-2.2.3**: Review notes and comments

- **Model**: ApplicationReviewNote

```prisma
model ApplicationReviewNote {
  id              String                @id @default(uuid())
  applicationId   String
  reviewerId      String
  noteType        String                // "comment", "request_clarification", "rejection_reason"
  content         String
  isInternal      Boolean               @default(false)  // Visible to applicant?
  createdAt       DateTime              @default(now())
}
```

**FR-2.2.4**: Bulk operations

- **API**: `POST /api/v1/applications/bulk-approve`
- **Validation**: All applications same election/contest
- **Transaction**: Atomic operation (all or nothing)
- **Performance**: Batch processing with queue system

### 2.3 Candidate Management

**FR-2.3.1**: Automatic candidate creation

```typescript
async function approveApplication(applicationId: string) {
  return await prisma.$transaction(async (tx) => {
    // Update application status
    const application = await tx.candidateApplication.update({
      where: { id: applicationId },
      data: { status: 'approved', reviewedAt: new Date() },
    });

    // Create candidate record
    const candidate = await tx.candidate.create({
      data: {
        contestId: application.contestId,
        fullName: application.fullName,
        partyId: application.partyId,
        isIndependent: application.isIndependent,
        applicationId: application.id,
        // candidateNumber assigned separately
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'create',
        entityType: 'candidate',
        entityId: candidate.id,
        userId: req.user.id,
        newValues: candidate,
      },
    });

    return candidate;
  });
}
```

**FR-2.3.2**: Candidate number assignment

- **Algorithm**: Sequential per contest, starting at 1
- **Display**: Ballot order determined by candidate number
- **Uniqueness**: Unique within contest (not across contests)

**FR-2.3.3**: Running mate management

```prisma
model Candidate {
  // ... existing fields
  runningMateFor    String?           // ID of presidential/gubernatorial candidate
  runningMate       Candidate?        @relation("RunningMates", fields: [runningMateFor], references: [id])
  deputyCandidates  Candidate[]       @relation("RunningMates")

  @@index([runningMateFor])
}
```

- **Validation**: Only for presidential/gubernatorial contests
- **Display**: Shown together on ballots and results

**FR-2.3.4**: Public candidate profiles

- **API**: `GET /api/v1/elections/{id}/candidates` (public, no auth)
- **RLS**: Only approved candidates in active/completed elections
- **Caching**: Redis with 1-hour TTL
- **Fields**: fullName, partyId, candidateNumber, biography, photoUrl (exclude PII)

## 3. Political Party Management

### 3.1 Party Registry

**FR-3.1.1**: Party registration (already implemented)

- **Model**: PoliticalParty (existing in schema)

```prisma
model PoliticalParty {
  id        String   @id @default(uuid())
  partyCode String   @unique      // Official IEBC code
  partyName String
  acronym   String?
  logoUrl   String?              // MinIO path to party logo

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  candidates Candidate[]
  coalitions PartyCoalitionMember[]

  @@index([partyCode])
}
```

**FR-3.1.2**: Party code standardization

- **Source**: Manual input by election administrators
- **Format**: Uppercase alphanumeric (e.g., "ODM", "UDA", "JUBILEE")
- **Validation**: Must exist in registry before candidate nomination
- **Management**: Admin interface for adding/editing/archiving parties

**FR-3.1.3**: Logo and branding

- **Storage**: MinIO bucket `political-parties`
- **Format**: PNG/SVG, max 500KB, square aspect ratio
- **CDN**: Cached for public display
- **Fallback**: Default party icon if logo missing

### 3.2 Coalition Management

**FR-3.2.1**: Coalition formation and registration

```prisma
model PartyCoalition {
  id              String                 @id @default(uuid())
  coalitionName   String
  acronym         String?
  logoUrl         String?

  // Coalition metadata
  formationDate   DateTime
  agreementDoc    String?                // MinIO path to agreement PDF
  isActive        Boolean                @default(true)

  // Leadership
  chairPartyId    String?                // Lead party in coalition

  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt

  // Relations
  members         PartyCoalitionMember[]
  contestAllocations CoalitionContestAllocation[]

  @@index([isActive])
}

model PartyCoalitionMember {
  id            String          @id @default(uuid())
  coalitionId   String
  coalition     PartyCoalition  @relation(fields: [coalitionId], references: [id], onDelete: Cascade)
  partyId       String
  party         PoliticalParty  @relation(fields: [partyId], references: [id])

  memberType    CoalitionType   // coalition, friendly_party
  joinedDate    DateTime        @default(now())
  leftDate      DateTime?

  createdAt     DateTime        @default(now())

  @@unique([coalitionId, partyId])
  @@index([coalitionId])
  @@index([partyId])
}

enum CoalitionType {
  coalition        // Full member with seat-sharing
  friendly_party   // Support agreement without seat-sharing
}
```

**FR-3.2.2**: Coalition agreement documentation

- **Upload**: PDF of signed coalition agreement
- **Storage**: MinIO with restricted access (election_manager only)
- **Metadata**: Formation date, expiry date, key terms
- **Validation**: Must be uploaded before contest allocation

**FR-3.2.3**: Contest allocation within coalitions

```prisma
model CoalitionContestAllocation {
  id              String          @id @default(uuid())
  coalitionId     String
  coalition       PartyCoalition  @relation(fields: [coalitionId], references: [id], onDelete: Cascade)
  electionId      String
  election        Election        @relation(fields: [electionId], references: [id])
  contestId       String
  contest         ElectionContest @relation(fields: [contestId], references: [id])

  // Allocation
  allocatedPartyId String
  allocatedParty   PoliticalParty @relation(fields: [allocatedPartyId], references: [id])

  // Approval workflow
  status          String          @default("proposed")  // proposed, approved, disputed
  proposedDate    DateTime        @default(now())
  approvedDate    DateTime?
  approvedBy      String?

  notes           String?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([coalitionId, electionId, contestId])
  @@index([coalitionId, electionId])
}
```

**Implementation Logic**:

```typescript
async function allocateContest(coalitionId, electionId, contestId, partyId) {
  // Validate party is coalition member
  const membership = await prisma.partyCoalitionMember.findFirst({
    where: {
      coalitionId,
      partyId,
      leftDate: null, // Still active member
    },
  });

  if (!membership) {
    throw new Error('Party is not an active coalition member');
  }

  // Create allocation (prevents duplicate via unique constraint)
  return await prisma.coalitionContestAllocation.create({
    data: {
      coalitionId,
      electionId,
      contestId,
      allocatedPartyId: partyId,
      status: 'proposed',
    },
  });
}
```

**FR-3.2.4**: Coalition dispute tracking

```prisma
model CoalitionDispute {
  id              String                      @id @default(uuid())
  allocationId    String?
  allocation      CoalitionContestAllocation? @relation(fields: [allocationId], references: [id])
  coalitionId     String

  disputeType     String                      // "seat_allocation", "leadership", "agreement_breach"
  description     String
  raisedByPartyId String

  status          String                      @default("open")  // open, mediation, resolved, unresolved
  resolution      String?
  resolvedAt      DateTime?

  createdAt       DateTime                    @default(now())
  updatedAt       DateTime                    @updatedAt

  @@index([coalitionId, status])
}
```

- **Workflow**: Party raises dispute → Coalition mediation → Resolution/Court
- **Notifications**: Alerts to all coalition members
- **Impact**: Can block contest allocation approval

## 4. Geographic Management & PostGIS Integration

### 4.1 Contest Scoping with Spatial Validation

**FR-4.1.1**: Automatic geographic validation (PostGIS)

- **Implementation**: Existing geographic hierarchy (Counties → Constituencies → Wards → Polling Stations)
- **Spatial Columns**:

```sql
-- Already in schema (see technical-considerations.txt line 792-800)
ALTER TABLE polling_stations
ADD COLUMN location_geography geography(Point, 4326)
GENERATED ALWAYS AS (
  CASE
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ELSE NULL
  END
) STORED;

CREATE INDEX idx_stations_location_spatial
ON polling_stations USING GIST (location_geography);
```

**FR-4.1.2**: Constituency-county relationship enforcement

```sql
-- Database constraint
ALTER TABLE constituencies
ADD CONSTRAINT fk_county_valid
FOREIGN KEY (county_id) REFERENCES counties(id)
ON DELETE RESTRICT;

-- Application-level validation
async function validateConstituency(constituencyId: string, countyId: string) {
  const valid = await prisma.$queryRaw<[{ exists: boolean }]>`
    SELECT EXISTS (
      SELECT 1 FROM constituencies
      WHERE id = ${constituencyId}::uuid
      AND county_id = ${countyId}::uuid
      AND deleted_at IS NULL
    ) as exists
  `;
  return valid[0].exists;
}
```

**FR-4.1.3**: Ward-constituency chain validation

```typescript
// Complete geographic chain validation
async function validateGeographicChain(wardId, constituencyId, countyId) {
  return await prisma.$queryRaw`
    SELECT 
      w.id as ward_id,
      w.name as ward_name,
      c.id as constituency_id,
      c.name as constituency_name,
      co.id as county_id,
      co.name as county_name
    FROM electoral_wards w
    JOIN constituencies c ON w.constituency_id = c.id
    JOIN counties co ON c.county_id = co.id
    WHERE w.id = ${wardId}
      AND c.id = ${constituencyId}
      AND co.id = ${countyId}
      AND w.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND co.deleted_at IS NULL
  `;
}
```

### 4.2 Special Voting Stations

**FR-4.2.1**: Diaspora polling stations

```prisma
model PollingStation {
  // ... existing fields from schema
  stationType      PollingStationType @default(regular)

  // Diaspora-specific
  country          String?            // For diaspora stations
  embassy          String?

  @@index([stationType])
}

enum PollingStationType {
  regular
  diaspora
  prison
  special_needs
  hospital
}
```

- **Geographic Scope**: Diaspora stations not linked to wards (special handling)
- **Results**: Aggregated separately, then added to national totals

**FR-4.2.2**: Prison facilities

- **Type**: `stationType = 'prison'`
- **Location**: GPS coordinates of prison facility
- **Access**: Restricted to authorized field observers
- **Privacy**: Results anonymized (no individual tracking)

**FR-4.2.3**: Special needs configuration

- **Type**: `stationType = 'special_needs'`
- **Features**: Accessible facilities metadata
- **Attributes**: Wheelchair access, Braille ballots, sign language support

## 5. Results Management & Integrity

### 5.1 Result Submission (Mobile-First)

**FR-5.1.1**: Mobile-optimized result entry

- **Model**: ElectionResult (existing, see technical-considerations.txt line 423-459)

```prisma
model ElectionResult {
  id               String          @id @default(uuid())
  electionId       String
  contestId        String
  candidateId      String
  pollingStationId String

  votes            Int             @default(0)
  resultLevel      ResultLevel
  resultStatus     ResultStatus    @default(preliminary)

  // Mobile submission metadata (GPS tracking)
  submittedBy      String
  deviceId         String?
  latitude         Float?
  longitude        Float?
  accuracyMeters   Int?

  // Audit and integrity
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  auditSignature   String?         // SHA-256 hash for tamper detection

  @@unique([contestId, pollingStationId, candidateId, resultLevel])
  @@index([electionId, contestId])
  @@index([pollingStationId])
  @@index([resultStatus])
}
```

**Mobile Offline Support**:

- **Sync**: OfflineAction queue for delayed submission
- **Validation**: Client-side validation before submission
- **Retry**: Automatic retry with exponential backoff
- **Conflict**: Last-write-wins with audit trail

**FR-5.1.2**: Form 34A/B/C reference tracking

```prisma
model ResultForm {
  id              String         @id @default(uuid())
  resultId        String         @unique
  result          ElectionResult @relation(fields: [resultId], references: [id])

  formType        String         // "34A" (station), "34B" (constituency), "34C" (national)
  formNumber      String         // Official form serial number

  // Image attachments
  scannedFormUrl  String?        // MinIO path to scanned form

  // Verification
  verifiedAt      DateTime?
  verifiedBy      String?
  discrepancies   Json?          // Any differences between form and digital entry

  createdAt       DateTime       @default(now())

  @@index([formType, formNumber])
}
```

**FR-5.1.3**: Geographic result aggregation

```typescript
// Real-time aggregation using materialized view
const liveResults = await prisma.$queryRaw`
  SELECT * FROM live_results_view
  WHERE election_id = ${electionId}
  AND contest_id = ${contestId}
  ORDER BY total_votes DESC
`;

// Manual aggregation for different levels
async function aggregateResults(electionId, contestId, level: ResultLevel) {
  switch (level) {
    case 'ward':
      return await prisma.$queryRaw`
        SELECT 
          candidate_id,
          SUM(votes) as total_votes,
          COUNT(DISTINCT polling_station_id) as stations_reporting
        FROM election_results er
        JOIN polling_stations ps ON er.polling_station_id = ps.id
        WHERE election_id = ${electionId}
          AND contest_id = ${contestId}
          AND result_status IN ('verified', 'confirmed')
        GROUP BY candidate_id, ps.ward_id
      `;

    case 'constituency':
    case 'county':
    case 'national':
    // Similar aggregation at different levels
  }
}
```

**FR-5.1.4**: Multi-stage verification workflow

```typescript
enum ResultStatus {
  preliminary   // Initial mobile submission
  verified      // Field supervisor verified
  confirmed     // Central tally confirmed
  disputed      // Flagged for investigation
}

// Verification workflow
async function verifyResult(resultId, verifierId, verificationLevel) {
  return await prisma.$transaction(async (tx) => {
    // Update result status
    const result = await tx.electionResult.update({
      where: { id: resultId },
      data: {
        resultStatus: verificationLevel,
        updatedAt: new Date()
      }
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'update',
        entityType: 'election_result',
        entityId: resultId,
        userId: verifierId,
        newValues: { resultStatus: verificationLevel }
      }
    });

    // Invalidate cache
    await redis.invalidatePattern(`election:${result.electionId}:*`);

    return result;
  });
}
```

### 5.2 Result Integrity & Tamper Detection

**FR-5.2.1**: Vote count validation

```typescript
// Validate against registered voters
async function validateVoteCount(pollingStationId, totalVotes) {
  const station = await prisma.pollingStation.findUnique({
    where: { id: pollingStationId },
    select: { registeredVoters: true },
  });

  if (totalVotes > station.registeredVoters) {
    throw new ValidationError(
      `Total votes (${totalVotes}) exceeds registered voters (${station.registeredVoters})`
    );
  }

  // Warning if turnout > 95% (possible anomaly)
  const turnout = (totalVotes / station.registeredVoters) * 100;
  if (turnout > 95) {
    await createIncident({
      severity: 'medium',
      title: 'High Turnout Alert',
      description: `Turnout of ${turnout.toFixed(
        2
      )}% at station ${pollingStationId}`,
      pollingStationId,
    });
  }
}
```

**FR-5.2.2**: Tamper-evident result hashing

```typescript
import * as crypto from 'crypto';

function generateResultSignature(result: ElectionResult): string {
  const data = [
    result.electionId,
    result.contestId,
    result.candidateId,
    result.pollingStationId,
    result.votes.toString(),
    result.submittedBy,
    result.createdAt.toISOString(),
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex');
}

// Verify integrity
function verifyResultSignature(result: ElectionResult): boolean {
  const expectedSignature = generateResultSignature(result);
  return result.auditSignature === expectedSignature;
}

// Apply on submission
async function submitResult(resultData) {
  const signature = generateResultSignature(resultData);

  return await prisma.electionResult.create({
    data: {
      ...resultData,
      auditSignature: signature,
    },
  });
}
```

**FR-5.2.3**: Multi-level verification chain

```prisma
model VerificationChain {
  id              String         @id @default(uuid())
  resultId        String
  result          ElectionResult @relation(fields: [resultId], references: [id])

  verificationLevel String       // "field_observer", "supervisor", "central_tally"
  verifiedBy      String
  verifier        User           @relation(fields: [verifiedBy], references: [id])

  previousHash    String?        // Hash of previous verification
  currentHash     String         // Hash including this verification
  signature       String         // Digital signature

  verifiedAt      DateTime       @default(now())

  @@index([resultId])
  @@index([verificationLevel, verifiedAt])
}
```

**Blockchain-style chain**:

```typescript
async function addVerificationToChain(resultId, verifierId, level) {
  // Get previous verification
  const previousVerification = await prisma.verificationChain.findFirst({
    where: { resultId },
    orderBy: { verifiedAt: 'desc' },
  });

  // Create hash including previous
  const currentHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        resultId,
        level,
        verifierId,
        previousHash: previousVerification?.currentHash || 'genesis',
        timestamp: new Date().toISOString(),
      })
    )
    .digest('hex');

  return await prisma.verificationChain.create({
    data: {
      resultId,
      verifiedBy: verifierId,
      verificationLevel: level,
      previousHash: previousVerification?.currentHash,
      currentHash,
      signature: currentHash, // In production, use proper digital signature
    },
  });
}
```

🔐 Security & Compliance Implementation

## Access Control & Row-Level Security (RLS)

**SR-1**: ABAC + RLS Hybrid Authorization

```sql
-- RLS Policy Examples (from technical-considerations.txt)

-- Elections: Public can view active/completed, managers can modify
CREATE POLICY "elections_public_read" ON elections
FOR SELECT USING (status IN ('active', 'completed'));

CREATE POLICY "election_managers_full_access" ON elections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('super_admin', 'election_manager')
  )
);

-- Results: Public read verified results, observers can submit
CREATE POLICY "results_public_read" ON election_results
FOR SELECT USING (result_status IN ('verified', 'confirmed'));

CREATE POLICY "field_observers_submit" ON election_results
FOR INSERT WITH CHECK (submitted_by = auth.uid());
```

**Application Layer**:

```typescript
// RLS Wrapper for user context
async function withUserContext<T>(
  userId: string,
  callback: (prisma: PrismaService) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set RLS context for this transaction
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return await callback(tx as PrismaService);
  });
}
```

**SR-2**: Role-Based Feature Access Matrix
| Feature | super_admin | election_manager | field_observer | public_viewer |
|---------|------------|------------------|----------------|---------------|
| Create Election | ✅ | ✅ | ❌ | ❌ |
| Create Contest | ✅ | ✅ | ❌ | ❌ |
| Review Applications | ✅ | ✅ | ❌ | ❌ |
| Submit Results | ✅ | ✅ | ✅ | ❌ |
| Verify Results | ✅ | ✅ | ❌ | ❌ |
| View Results | ✅ | ✅ | ✅ | ✅ (verified only) |

**SR-3**: Geographic Scope Enforcement

```typescript
// Middleware for geographic access control
async function checkGeographicAccess(user, pollingStationId) {
  if (user.role === 'field_observer') {
    // Check if observer is assigned to this station's ward/constituency
    const hasAccess = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM observer_assignments oa
        JOIN polling_stations ps ON (
          oa.county_id = (SELECT county_id FROM constituencies WHERE id = (SELECT constituency_id FROM electoral_wards WHERE id = ps.ward_id))
          OR oa.constituency_id = (SELECT constituency_id FROM electoral_wards WHERE id = ps.ward_id)
          OR oa.ward_id = ps.ward_id
        )
        WHERE oa.user_id = ${user.id}
        AND ps.id = ${pollingStationId}
        AND oa.is_active = true
      )
    `;

    if (!hasAccess[0].exists) {
      throw new ForbiddenError('Geographic access denied');
    }
  }
}
```

**SR-4**: Comprehensive Audit Trail

```typescript
// Audit middleware (see technical-considerations.txt line 1304-1375)
interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  requestId?: string;
  correlationId?: string;
}

async function createAuditLog(entry: AuditEntry) {
  return await prisma.auditLog.create({
    data: {
      ...entry,
      createdAt: new Date(),
    },
  });
}
```

## Data Protection & Encryption

**SR-5**: PII Field-Level Encryption

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

  encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  decrypt(encryptedData: string): string {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);

    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Usage in application service
async function createCandidateApplication(data) {
  const encryption = new EncryptionService();

  return await prisma.candidateApplication.create({
    data: {
      ...data,
      nationalId: encryption.encrypt(data.nationalId),
      dateOfBirth: encryption.encrypt(data.dateOfBirth.toISOString()),
    },
  });
}
```

**SR-6**: Secure Document Storage (MinIO)

```typescript
// MinIO Service (see technical-considerations.txt line 1120-1126)
class MinioService {
  private client: Minio.Client;

  async uploadSecureDocument(
    file: Buffer,
    fileName: string,
    metadata: any
  ): Promise<string> {
    const bucket = 'candidate-applications';
    const objectName = `${uuidv4()}-${fileName}`;

    // Server-side encryption
    await this.client.putObject(bucket, objectName, file, {
      'Content-Type': metadata.mimeType,
      'x-amz-server-side-encryption': 'AES256',
      'x-amz-meta-uploaded-by': metadata.uploadedBy,
      'x-amz-meta-timestamp': new Date().toISOString(),
    });

    return objectName;
  }

  async getPresignedUrl(
    objectName: string,
    expirySeconds: number = 3600
  ): Promise<string> {
    // Temporary access URL with expiry
    return await this.client.presignedGetObject(
      'candidate-applications',
      objectName,
      expirySeconds
    );
  }
}
```

**SR-7 & SR-8**: Data Retention & GDPR Compliance

```typescript
// Data retention policies
const RETENTION_POLICIES = {
  candidate_applications: 365 * 5, // 5 years
  election_results: Infinity, // Permanent
  audit_logs: 365 * 7, // 7 years
  sessions: 30, // 30 days
};

// GDPR: Right to be forgotten
async function anonymizeCandidateData(nationalId: string) {
  return await prisma.$transaction(async (tx) => {
    // Find all applications
    const applications = await tx.candidateApplication.findMany({
      where: { nationalId },
    });

    // Anonymize PII
    for (const app of applications) {
      await tx.candidateApplication.update({
        where: { id: app.id },
        data: {
          nationalId: 'ANONYMIZED',
          email: 'anonymized@example.com',
          phoneNumber: 'ANONYMIZED',
          dateOfBirth: new Date('1900-01-01'),
        },
      });
    }

    // Audit the anonymization
    await tx.auditLog.create({
      data: {
        action: 'delete',
        entityType: 'candidate_application',
        entityId: 'multiple',
        userId: 'system',
        newValues: { anonymized: true, reason: 'GDPR request' },
      },
    });
  });
}
```

## Election Integrity & Tamper Detection

**SR-9**: Tamper-Evident Recording (already implemented in FR-5.2.2)

**SR-10**: Comprehensive Audit Logging

- ✅ All database mutations logged
- ✅ GPS coordinates tracked for mobile submissions
- ✅ Request correlation IDs for distributed tracing
- ✅ Old/new value comparison
- ✅ Partitioned for performance (monthly partitions)

**SR-11**: Conflict of Interest Prevention

```typescript
// Prevent users from verifying their own submissions
async function verifyResult(resultId, verifierId) {
  const result = await prisma.electionResult.findUnique({
    where: { id: resultId },
  });

  if (result.submittedBy === verifierId) {
    throw new ConflictOfInterestError(
      'Cannot verify your own result submission'
    );
  }

  // Proceed with verification...
}

// Prevent candidate from being reviewer
async function assignReviewer(applicationId, reviewerId) {
  const application = await prisma.candidateApplication.findUnique({
    where: { id: applicationId },
  });

  if (application.applicantUserId === reviewerId) {
    throw new ConflictOfInterestError('Cannot review your own application');
  }
}
```

**SR-12**: Dual Control for Critical Operations

```typescript
// Critical operations require two approvals
model CriticalActionApproval {
  id              String   @id @default(uuid())
  actionType      String   // "cancel_election", "delete_results", "certify_election"
  actionData      Json

  requestedBy     String
  requestedAt     DateTime @default(now())

  approvedBy      String?
  approvedAt      DateTime?

  status          String   @default("pending")  // pending, approved, rejected

  @@index([status, actionType])
}

async function requestCriticalAction(actionType, actionData, requestedBy) {
  return await prisma.criticalActionApproval.create({
    data: {
      actionType,
      actionData,
      requestedBy,
      status: 'pending'
    }
  });
}

async function approveCriticalAction(approvalId, approverId) {
  const approval = await prisma.criticalActionApproval.findUnique({
    where: { id: approvalId }
  });

  // Cannot approve your own request
  if (approval.requestedBy === approverId) {
    throw new Error('Cannot approve your own request');
  }

  // Execute the action
  await executeAction(approval.actionType, approval.actionData);

  // Mark as approved
  return await prisma.criticalActionApproval.update({
    where: { id: approvalId },
    data: {
      approvedBy: approverId,
      approvedAt: new Date(),
      status: 'approved'
    }
  });
}
```

## Data Model Requirements - Complete Schema

### New Models Required

#### CandidateApplication (Nomination System)

```prisma
model CandidateApplication {
  id                String            @id @default(uuid())
  electionId        String
  election          Election          @relation(fields: [electionId], references: [id])
  contestId         String
  contest           ElectionContest   @relation(fields: [contestId], references: [id])
  applicantUserId   String?
  applicant         User?             @relation("ApplicationsSubmitted", fields: [applicantUserId], references: [id])

  // Personal Information (encrypted)
  nationalId        String
  fullName          String
  dateOfBirth       DateTime
  gender            Gender
  phoneNumber       String
  email             String
  biography         String?

  // Political Affiliation
  partyId           String?
  party             PoliticalParty?   @relation(fields: [partyId], references: [id])
  isIndependent     Boolean           @default(false)
  nominationType    NominationType

  // Geographic validation
  countyId          String?
  county            County?           @relation(fields: [countyId], references: [id])
  constituencyId    String?
  constituency      Constituency?     @relation(fields: [constituencyId], references: [id])
  wardId            String?
  ward              ElectoralWard?    @relation(fields: [wardId], references: [id])

  // Application Status
  status            ApplicationStatus @default(draft)
  submittedAt       DateTime?
  reviewedBy        String?
  reviewer          User?             @relation("ApplicationsReviewed", fields: [reviewedBy], references: [id])
  reviewedAt        DateTime?
  reviewNotes       String?
  rejectionReason   String?

  // Relations
  documents         ApplicationDocument[]
  reviewNotes       ApplicationReviewNote[]
  candidate         Candidate?        // Created on approval

  // Audit trail
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@unique([electionId, contestId, nationalId])
  @@index([status, submittedAt])
  @@index([electionId, contestId])
  @@map("candidate_applications")
}
```

#### PartyCoalition (Coalition Management)

```prisma
model PartyCoalition {
  id                  String                      @id @default(uuid())
  coalitionName       String
  acronym             String?
  logoUrl             String?

  formationDate       DateTime
  agreementDoc        String?
  isActive            Boolean                     @default(true)
  chairPartyId        String?
  chairParty          PoliticalParty?             @relation("ChairParty", fields: [chairPartyId], references: [id])

  createdAt           DateTime                    @default(now())
  updatedAt           DateTime                    @updatedAt

  members             PartyCoalitionMember[]
  contestAllocations  CoalitionContestAllocation[]
  disputes            CoalitionDispute[]

  @@index([isActive])
  @@map("party_coalitions")
}

model PartyCoalitionMember {
  id            String          @id @default(uuid())
  coalitionId   String
  coalition     PartyCoalition  @relation(fields: [coalitionId], references: [id], onDelete: Cascade)
  partyId       String
  party         PoliticalParty  @relation("CoalitionMemberships", fields: [partyId], references: [id])

  memberType    CoalitionType
  joinedDate    DateTime        @default(now())
  leftDate      DateTime?

  createdAt     DateTime        @default(now())

  @@unique([coalitionId, partyId])
  @@index([coalitionId])
  @@index([partyId])
  @@map("party_coalition_members")
}
```

#### Required Enums

```prisma
enum ContestType {
  presidential
  gubernatorial
  senatorial
  womens_representative
  national_assembly
  county_assembly
}

enum ApplicationStatus {
  draft
  submitted
  under_review
  approved
  rejected
  withdrawn
}

enum NominationType {
  direct_nomination
  primary_election
  coalition_agreement
}

enum CoalitionType {
  coalition
  friendly_party
}

enum PollingStationType {
  regular
  diaspora
  prison
  special_needs
  hospital
}
```

### Enhanced Existing Models

#### Election (Add Fields)

```prisma
model Election {
  // ... existing fields ...

  // NEW FIELDS:
  nominationOpenDate   DateTime?
  nominationCloseDate  DateTime?
  partyListDeadline    DateTime?
  resultsPublishDate   DateTime?

  // NEW RELATIONS:
  applications         CandidateApplication[]
  coalitionAllocations CoalitionContestAllocation[]
}
```

#### ElectionContest (Add Geographic Scoping)

```prisma
model ElectionContest {
  // ... existing fields ...

  // NEW FIELDS:
  contestType      ContestType
  countyId         String?
  county           County?          @relation(fields: [countyId], references: [id])
  constituencyId   String?
  constituency     Constituency?    @relation(fields: [constituencyId], references: [id])
  wardId           String?
  ward             ElectoralWard?   @relation(fields: [wardId], references: [id])

  // NEW RELATIONS:
  applications     CandidateApplication[]
  allocations      CoalitionContestAllocation[]

  @@index([contestType])
  @@index([countyId])
  @@index([constituencyId])
  @@index([wardId])
}
```

#### Candidate (Add Application Link)

```prisma
model Candidate {
  // ... existing fields ...

  // NEW FIELDS:
  applicationId    String?           @unique
  application      CandidateApplication? @relation(fields: [applicationId], references: [id])
  nominationType   NominationType?
  runningMateFor   String?
  runningMate      Candidate?        @relation("RunningMates", fields: [runningMateFor], references: [id])
  deputyCandidates Candidate[]       @relation("RunningMates")

  @@index([runningMateFor])
}
```

#### PollingStation (Add Station Type)

```prisma
model PollingStation {
  // ... existing fields ...

  // NEW FIELDS:
  stationType      PollingStationType @default(regular)
  country          String?            // For diaspora stations
  embassy          String?            // For diaspora stations

  @@index([stationType])
}
```

#### User (Add Application Relations)

```prisma
model User {
  // ... existing fields ...

  // NEW RELATIONS:
  applicationsSubmitted  CandidateApplication[] @relation("ApplicationsSubmitted")
  applicationsReviewed   CandidateApplication[] @relation("ApplicationsReviewed")
  verifications          VerificationChain[]
}
```

### Supporting Models

#### ApplicationDocument

```prisma
model ApplicationDocument {
  id                 String                @id @default(uuid())
  applicationId      String
  application        CandidateApplication  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  documentType       String
  fileName           String
  filePath           String
  fileSize           BigInt
  mimeType           String

  uploadedAt         DateTime              @default(now())
  verifiedAt         DateTime?
  verifiedBy         String?

  @@index([applicationId])
  @@map("application_documents")
}
```

#### ResultForm (Form 34A/B/C Tracking)

```prisma
model ResultForm {
  id              String         @id @default(uuid())
  resultId        String         @unique
  result          ElectionResult @relation(fields: [resultId], references: [id])

  formType        String
  formNumber      String
  scannedFormUrl  String?

  verifiedAt      DateTime?
  verifiedBy      String?
  discrepancies   Json?

  createdAt       DateTime       @default(now())

  @@index([formType, formNumber])
  @@map("result_forms")
}
```

#### VerificationChain (Blockchain-style Integrity)

```prisma
model VerificationChain {
  id                String         @id @default(uuid())
  resultId          String
  result            ElectionResult @relation(fields: [resultId], references: [id])

  verificationLevel String
  verifiedBy        String
  verifier          User           @relation(fields: [verifiedBy], references: [id])

  previousHash      String?
  currentHash       String
  signature         String

  verifiedAt        DateTime       @default(now())

  @@index([resultId])
  @@index([verificationLevel, verifiedAt])
  @@map("verification_chains")
}
```

🔌 Integration Requirements & API Specifications

## Internal Integrations

**IR-1**: User Authentication & ABAC (existing)

- **Integration Point**: JWT validation middleware
- **User Context**: Set via `auth.uid()` function for RLS
- **Session Management**: Database-backed refresh tokens (existing)

```typescript
// Already implemented in auth.service.ts
interface AuthUser {
  id: string;
  role: UserRole;
  sessionId: string;
}
```

**IR-2**: Geographic Hierarchy (existing)

- **Integration**: Existing County → Constituency → Ward → PollingStation tables
- **Validation**: PostGIS spatial validation
- **Caching**: Redis cache for geographic lookups (county:_, ward:_)

**IR-3**: Audit System (existing)

- **Integration**: AuditLog model with automatic triggers
- **Middleware**: Request/response interceptor for all mutations
- **Partitioning**: Monthly partitions for scalability

**IR-4**: Notification System (existing)

```typescript
// Integration with existing Notification model
async function notifyApplicationStatusChange(
  application: CandidateApplication,
  newStatus: ApplicationStatus
) {
  await prisma.notification.create({
    data: {
      userId: application.applicantUserId!,
      title: `Application ${newStatus}`,
      message: `Your application for ${contest.positionName} is now ${newStatus}`,
      type: 'assignment',
      priority: newStatus === 'approved' ? 'high' : 'medium',
    },
  });
}
```

## External Interfaces & APIs

**IR-5**: Political Party Management (Manual Input)

```typescript
// Manual party management via admin interface
// No external API integration - all data entered by administrators

/**
 * Admin API for managing political parties
 * POST /api/v1/admin/parties - Create new party
 * PUT  /api/v1/admin/parties/:id - Update party details
 * DELETE /api/v1/admin/parties/:id - Archive party (soft delete)
 */

interface CreatePartyDTO {
  partyCode: string; // Unique code (e.g., "ODM", "UDA")
  partyName: string; // Full name
  acronym?: string; // Short form
  logoFile?: File; // Party logo upload
}

async function createPoliticalParty(data: CreatePartyDTO, adminUserId: string) {
  // Validate party code uniqueness
  const existing = await prisma.politicalParty.findUnique({
    where: { partyCode: data.partyCode },
  });

  if (existing && !existing.deletedAt) {
    throw new Error('Party code already exists');
  }

  // Upload logo to MinIO if provided
  let logoUrl: string | undefined;
  if (data.logoFile) {
    logoUrl = await minioService.uploadPartyLogo(data.logoFile);
  }

  // Create party record
  const party = await prisma.politicalParty.create({
    data: {
      partyCode: data.partyCode.toUpperCase(),
      partyName: data.partyName,
      acronym: data.acronym,
      logoUrl,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'create',
      entityType: 'political_party',
      entityId: party.id,
      userId: adminUserId,
      newValues: party,
    },
  });

  return party;
}
```

**IR-6**: Candidate Clearance APIs (Future - Optional)

```typescript
// Integration points for candidate vetting
interface ClearanceAPIs {
  EACC: {
    // Ethics & Anti-Corruption Commission
    endpoint: '/api/clearance/check';
    method: 'POST';
    payload: { nationalId: string };
    response: { cleared: boolean; certificateNumber?: string };
  };
  HELB: {
    // Higher Education Loans Board
    endpoint: '/api/defaulters/check';
    method: 'POST';
    payload: { nationalId: string };
    response: { hasDefaultedLoan: boolean };
  };
  KRA: {
    // Kenya Revenue Authority
    endpoint: '/api/tax-compliance/check';
    method: 'POST';
    payload: { nationalId: string };
    response: { isCompliant: boolean; pin: string };
  };
}

async function performCandidateClearance(nationalId: string) {
  const results = {
    eacc: await checkEACCClearance(nationalId),
    helb: await checkHELBCompliance(nationalId),
    kra: await checkKRATaxCompliance(nationalId),
  };

  return {
    cleared:
      results.eacc.cleared &&
      !results.helb.hasDefaultedLoan &&
      results.kra.isCompliant,
    details: results,
  };
}
```

**IR-7**: Voter Registration Interface (Read-only)

```typescript
// Integration with voter registration system
async function validateCandidateEligibility(nationalId: string) {
  // Check if candidate is registered voter
  const isRegistered = await externalVoterAPI.checkRegistration(nationalId);

  if (!isRegistered) {
    throw new ValidationError('Candidate must be a registered voter');
  }
}
```

**IR-8**: Public Results API

```typescript
// Public-facing API endpoints (no auth required for verified results)
/**
 * GET /api/v1/elections/{electionId}/results
 * Query params: contestId, level (ward|constituency|county|national)
 * Returns: Aggregated results with caching
 */
router.get('/api/v1/elections/:electionId/results', async (req, res) => {
  const { electionId } = req.params;
  const { contestId, level = 'polling_station' } = req.query;

  const cacheKey = `results:${electionId}:${contestId}:${level}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  // Query materialized view
  const results = await prisma.$queryRaw`
    SELECT * FROM live_results_view
    WHERE election_id = ${electionId}
    ${contestId ? sql`AND contest_id = ${contestId}` : sql``}
    ORDER BY total_votes DESC
  `;

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(results));

  res.json(results);
});
```

## Complete API Specification

### Election Management APIs

```typescript
// Elections
POST   /api/v1/elections                    // Create election
GET    /api/v1/elections                    // List elections
GET    /api/v1/elections/:id                // Get election details
PUT    /api/v1/elections/:id                // Update election
DELETE /api/v1/elections/:id                // Delete election (soft)
PATCH  /api/v1/elections/:id/status         // Change status

// Election Contests
POST   /api/v1/elections/:electionId/contests          // Create contest
GET    /api/v1/elections/:electionId/contests          // List contests
PUT    /api/v1/elections/:electionId/contests/:id      // Update contest
DELETE /api/v1/elections/:electionId/contests/:id      // Delete contest
```

### Nomination & Candidate APIs

```typescript
// Applications
POST   /api/v1/applications                             // Submit application
GET    /api/v1/applications                             // List applications (filtered by role)
GET    /api/v1/applications/:id                         // Get application
PUT    /api/v1/applications/:id                         // Update draft application
POST   /api/v1/applications/:id/submit                  // Submit for review
POST   /api/v1/applications/:id/review                  // Review application
POST   /api/v1/applications/:id/approve                 // Approve application
POST   /api/v1/applications/:id/reject                  // Reject application
POST   /api/v1/applications/bulk-approve                // Bulk approve

// Application Documents
POST   /api/v1/applications/:id/documents               // Upload document
GET    /api/v1/applications/:id/documents               // List documents
DELETE /api/v1/applications/:id/documents/:documentId   // Delete document

// Candidates
GET    /api/v1/elections/:electionId/candidates         // List candidates (public)
GET    /api/v1/contests/:contestId/candidates           // List by contest (public)
PATCH  /api/v1/candidates/:id/number                    // Assign candidate number
```

### Coalition APIs

```typescript
// Coalitions
POST   /api/v1/coalitions                               // Create coalition
GET    /api/v1/coalitions                               // List coalitions
GET    /api/v1/coalitions/:id                           // Get coalition
PUT    /api/v1/coalitions/:id                           // Update coalition
POST   /api/v1/coalitions/:id/members                   // Add party member
DELETE /api/v1/coalitions/:id/members/:partyId          // Remove member

// Contest Allocations
POST   /api/v1/coalitions/:id/allocations               // Propose allocation
GET    /api/v1/coalitions/:id/allocations               // List allocations
PATCH  /api/v1/coalitions/:id/allocations/:allocationId // Approve/reject
```

### Results APIs

```typescript
// Result Submission
POST   /api/v1/results                      // Submit result
GET    /api/v1/results                      // List results (filtered)
GET    /api/v1/results/:id                  // Get result details
PATCH  /api/v1/results/:id/verify           // Verify result
POST   /api/v1/results/:id/dispute          // Flag dispute

// Public Results
GET    /api/v1/elections/:id/results        // Aggregated results (public)
GET    /api/v1/elections/:id/results/live   // WebSocket endpoint
GET    /api/v1/elections/:id/results/export // Export CSV/PDF
```

📱 User Interface & Frontend Integration

## Admin Interfaces (Vue.js)

**UI-1**: Election Setup Dashboard

- **Route**: `/admin/elections`
- **Components**: ElectionList.vue, ElectionForm.vue, ContestForm.vue
- **Features**:
  - Create/edit elections with date pickers
  - Manage contests with geographic scope dropdown
  - Status workflow visualization
  - Bulk operations support
- **State Management**: Pinia store (`useElectionStore`)

**UI-2**: Application Review Workspace

- **Route**: `/admin/applications`
- **Components**: ApplicationList.vue, ApplicationReview.vue, DocumentViewer.vue
- **Features**:
  - Filterable application list (status, contest, party)
  - Side-by-side document viewer
  - Inline approval/rejection workflow
  - Bulk approve with preview
  - Review history timeline
- **Real-time**: WebSocket updates on application status changes

**UI-3**: Coalition Management Interface

- **Route**: `/admin/coalitions`
- **Components**: CoalitionList.vue, CoalitionForm.vue, ContestAllocation.vue
- **Features**:
  - Coalition formation wizard
  - Member party selection with drag-drop
  - Contest allocation matrix view
  - Dispute tracking dashboard
- **Validation**: Real-time coalition rules validation

**UI-4**: Results Dashboard

- **Route**: `/admin/results`
- **Components**: ResultsMonitor.vue, VerificationQueue.vue, ResultsMap.vue
- **Features**:
  - Real-time results incoming feed
  - Geographic heatmap (PostGIS integration)
  - Verification queue with filters
  - Anomaly detection alerts (high turnout, discrepancies)
  - Export to CSV/PDF
- **Performance**: Virtual scrolling for large datasets

## Public Interfaces (No Auth Required)

**UI-5**: Candidate Application Portal

- **Route**: `/apply`
- **Components**: ApplicationWizard.vue (multi-step form)
- **Steps**:
  1. Election & Contest Selection
  2. Personal Information (with validation)
  3. Party Affiliation
  4. Document Upload (drag-drop, progress bars)
  5. Review & Submit
- **Features**:
  - Auto-save drafts to localStorage
  - Resume incomplete applications
  - Document preview before upload
  - Real-time validation feedback

**UI-6**: Election Information Display

- **Route**: `/elections/:id`
- **Components**: ElectionDetail.vue, ContestList.vue, CandidateCard.vue
- **Features**:
  - Public election calendar
  - Contest breakdown by region
  - Candidate profiles with photos
  - Interactive geographic map
- **SEO**: Server-side rendering for public pages

**UI-7**: Public Results Visualization

- **Route**: `/results/:electionId`
- **Components**: ResultsDashboard.vue, ResultsChart.vue, ResultsTable.vue
- **Features**:
  - Live results ticker (WebSocket)
  - Interactive charts (Chart.js, D3.js)
  - Geographic drill-down (National → County → Constituency → Ward)
  - Share results on social media
  - Embeddable widgets
- **Performance**:
  - Lazy load charts
  - Paginated results table
  - Redis caching (5-min TTL)

## Mobile Interfaces - Result Submission

> 📱 **See detailed mobile strategy**: [MOBILE_STRATEGY.md](./MOBILE_STRATEGY.md)

**Decision**: Progressive Web App (PWA) recommended for initial implementation, with option to add React Native app later if needed.

**Key Requirement**: **Offline-First** - Field observers must be able to submit results without internet connection. Results sync automatically when online.

**UI-8**: Field Observer PWA

- **Platform**: PWA (works offline, installable, cross-platform)
- **Features**:
  - Result submission form with camera integration (HTML5)
  - GPS location capture and validation
  - Form 34A photo upload
  - IndexedDB offline queue management
  - Background sync when connection restored
  - Manual sync button as fallback
  - Clear sync status indicators
- **Offline Strategy**:
  ```typescript
  // Service Worker for offline caching
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  ```

**UI-9**: Offline Data Collection

- **Storage**: IndexedDB for form data
- **Sync**: Background sync when connection restored
- **Conflict Resolution**: Server timestamp wins

```typescript
// IndexedDB schema
const db = await openDB('election-app', 1, {
  upgrade(db) {
    db.createObjectStore('pending-results', { keyPath: 'id' });
    db.createObjectStore('elections', { keyPath: 'id' });
    db.createObjectStore('candidates', { keyPath: 'id' });
  },
});
```

**UI-10**: GPS Validation

- **Library**: Geolocation API
- **Validation**: Proximity to assigned polling station (within 500m)
- **Accuracy**: Require GPS accuracy < 50m

```typescript
async function validateLocation(pollingStationId: string) {
  const position = await getCurrentPosition({ enableHighAccuracy: true });

  if (position.coords.accuracy > 50) {
    throw new Error('GPS accuracy insufficient. Move to open area.');
  }

  const station = await getPollingStation(pollingStationId);
  const distance = calculateDistance(
    position.coords.latitude,
    position.coords.longitude,
    station.latitude,
    station.longitude
  );

  if (distance > 500) {
    throw new Error(
      `You are ${distance}m from the polling station. Must be within 500m.`
    );
  }
}
```

🚀 Non-Functional Requirements & Performance Targets

## Performance Requirements

**NFR-1**: High Concurrency Support

- **Target**: 10,000+ concurrent result submissions during peak hours
- **Implementation**:
  - PgBouncer connection pooling (max 1000 client connections, 25 pool size)
  - Async processing with queue system (Bull/BullMQ)
  - Result submission endpoint rate limit: 100 req/min per user
  ```typescript
  // Rate limiting configuration
  const resultSubmissionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ client: redis }),
  });
  ```

**NFR-2**: Fast Result Aggregation

- **Target**: < 2 seconds for any aggregation query
- **Implementation**:
  - Materialized views (`live_results_view`, `election_summary_view`)
  - Concurrent refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY`
  - Redis caching with 5-minute TTL
  - Database indexes on critical query paths
  ```sql
  -- Critical indexes
  CREATE INDEX CONCURRENTLY idx_results_election_contest
    ON election_results(election_id, contest_id);
  CREATE INDEX CONCURRENTLY idx_results_status
    ON election_results(result_status) WHERE result_status IN ('verified', 'confirmed');
  ```

**NFR-3**: API Response Times

- **Target**: < 500ms for 95th percentile, < 200ms for median
- **Monitoring**: Prometheus metrics with alerting
- **Implementation**:
  - Database query optimization (EXPLAIN ANALYZE)
  - N+1 query prevention (Prisma includes)
  - Response compression (gzip)
  - CDN for static assets
  ```typescript
  // Performance monitoring
  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.2, 0.5, 1, 2, 5], // SLA targets
  });
  ```

**NFR-4**: Large Dataset Support

- **Target**: 50,000+ candidates across all elections
- **Implementation**:
  - Pagination (limit: 50 per page)
  - Cursor-based pagination for infinite scroll
  - Database partitioning for elections table
  - Lazy loading for candidate photos (presigned URLs)

## Availability & Reliability

**NFR-5**: High Availability

- **Target**: 99.9% uptime (43.8 minutes downtime/month max)
- **Implementation**:
  - Docker Compose with restart policies
  - Health check endpoints (`/health`, `/ready`)
  - Database replication (master-replica setup)
  - Automated failover for PostgreSQL
  ```yaml
  # docker-compose.yml health check
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
  ```

**NFR-6**: Graceful Degradation

- **Strategy**: Circuit breaker pattern for external services
- **Implementation**:

  ```typescript
  class CircuitBreaker {
    private failures = 0;
    private threshold = 5;
    private timeout = 60000; // 1 minute
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    async execute<T>(fn: () => Promise<T>): Promise<T> {
      if (this.state === 'open') {
        throw new Error('Circuit breaker is OPEN');
      }

      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    }
  }
  ```

**NFR-7**: Disaster Recovery

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 15 minutes
- **Implementation**:

  - Automated daily backups (retention: 30 days, 8 weeks, 6 months)
  - Point-in-time recovery with WAL archiving
  - Backup verification and restore testing
  - Documented DR procedures

  ```bash
  # Automated backup script
  #!/bin/bash
  BACKUP_DIR="/backups/$(date +%Y%m%d)"
  pg_dump -Fc elections > "$BACKUP_DIR/elections.dump"
  pg_dumpall --globals-only > "$BACKUP_DIR/globals.sql"

  # Test restore
  pg_restore --list "$BACKUP_DIR/elections.dump" > /dev/null
  ```

## Scalability

**NFR-8**: National-Scale Support

- **Capacity Planning**:
  - 47 counties × ~290 constituencies × ~1,450 wards = ~46,000 polling stations
  - 6 contests per station × 10 candidates avg = 2.76M result records per election
  - 100K+ concurrent users during results period
- **Implementation**:
  - Database partitioning (10 hash partitions for results)
  - Read replicas for reporting queries
  - Horizontal scaling via load balancer

**NFR-9**: Horizontal Scalability

- **Architecture**: Stateless API servers behind load balancer
- **Session Storage**: Redis (shared across instances)
- **File Storage**: MinIO (clustered mode for HA)
- **Database**: PgBouncer for connection pooling

**NFR-10**: Audit Log Partitioning

- **Strategy**: Monthly range partitions with auto-creation
- **Retention**: 7 years for compliance
- **Archival**: Move old partitions to cold storage (S3 Glacier)
- **Implementation**: Already in technical-considerations.txt (line 751-776)

## Usability & Accessibility

**NFR-11**: User-Friendly Interface

- **Design**: Material Design principles
- **Workflow**: Wizard-style multi-step forms
- **Feedback**: Inline validation with clear error messages
- **Help**: Contextual tooltips and help documentation
- **Testing**: User acceptance testing with election officials

**NFR-12**: Multi-Language Support

- **Languages**: English (primary), Swahili
- **Implementation**: Vue I18n

```typescript
// i18n configuration
const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      election: {
        create: 'Create Election',
        status: {
          draft: 'Draft',
          active: 'Active',
          completed: 'Completed',
        },
      },
    },
    sw: {
      election: {
        create: 'Unda Uchaguzi',
        status: {
          draft: 'Rasimu',
          active: 'Inaendelea',
          completed: 'Imekamilika',
        },
      },
    },
  },
});
```

**NFR-13**: Accessibility (WCAG 2.1 AA)

- **Requirements**:
  - Keyboard navigation support
  - Screen reader compatibility (ARIA labels)
  - Color contrast ratio ≥ 4.5:1
  - Form labels and error messages
  - Focus indicators
- **Testing**: axe-core automated testing

```typescript
// Automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('Application form should be accessible', async () => {
  const { container } = render(ApplicationForm);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Security & Compliance

**NFR-14**: Rate Limiting

- **Implementation**: Per-endpoint limits using Redis
- **Limits**:
  - Login: 5 attempts per 15 minutes
  - API requests: 1000/hour per user
  - Result submission: 100/minute per user
  - File upload: 10/minute per user

**NFR-15**: Input Validation

- **Server-side**: Zod schemas for all inputs

```typescript
import { z } from 'zod';

const ApplicationSchema = z
  .object({
    nationalId: z.string().regex(/^\d{7,8}$/),
    email: z.string().email(),
    phoneNumber: z.string().regex(/^(\+254|0)[17]\d{8}$/),
    partyId: z.string().uuid().optional(),
    isIndependent: z.boolean(),
  })
  .refine((data) => data.partyId || data.isIndependent, {
    message: 'Must select party or be independent',
  });
```

**NFR-16**: Error Handling

- **Strategy**: Consistent error responses

```typescript
interface APIError {
  status: number;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

// Global error handler
app.use((err, req, res, next) => {
  const error: APIError = {
    status: err.status || 500,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
  };

  // Log error
  logger.error('Request failed', { error, req });

  res.status(error.status).json({ error });
});
```

📅 Implementation Roadmap & Phases

## 🚨 Phase 1: Foundation & Data Model (Weeks 1-2)

**Priority**: CRITICAL  
**Dependencies**: Existing technical infrastructure

### Database Schema Implementation

- [ ] **Day 1-2**: Add new enums to Prisma schema
  ```prisma
  - ContestType
  - ApplicationStatus
  - NominationType
  - CoalitionType
  - PollingStationType
  ```
- [ ] **Day 3-4**: Create new models

  - CandidateApplication (with all relations)
  - PartyCoalition, PartyCoalitionMember
  - CoalitionContestAllocation, CoalitionDispute
  - ApplicationDocument, ApplicationReviewNote
  - ResultForm, VerificationChain
  - CriticalActionApproval

- [ ] **Day 5-6**: Enhance existing models

  - Election: Add nomination dates, party list deadline
  - ElectionContest: Add contestType, geographic foreign keys
  - Candidate: Add applicationId, nominationType, running mate relation
  - PollingStation: Add stationType, country, embassy
  - User: Add application relations

- [ ] **Day 7-8**: Create and test migrations

  ```bash
  npx prisma migrate dev --name add_election_management
  npx prisma generate
  ```

- [ ] **Day 9**: Seed reference data

  - Political parties (ODM, UDA, JUBILEE, etc.)
  - Test election with contests
  - Sample candidates

- [ ] **Day 10**: Create raw SQL advanced features
  - Geographic validation functions
  - Materialized view for election summaries
  - RLS policies for new tables

### Backend Services (Basic CRUD)

- [ ] **Day 11-12**: Election service enhancements

  - Create election with contests
  - Update election dates
  - Status workflow transitions

- [ ] **Day 13-14**: Party and Coalition services
  - Political party CRUD
  - Coalition formation
  - Member management

### Success Criteria

- ✅ All migrations run successfully on clean database
- ✅ Prisma schema validates without errors
- ✅ Basic CRUD operations work for all new models
- ✅ Existing functionality unaffected
- ✅ Integration tests pass

---

## 📋 Phase 2: Nomination System (Weeks 3-4)

**Priority**: HIGH  
**Dependencies**: Phase 1 complete

### Backend Implementation

- [ ] **Day 1-3**: Application submission flow

  - Application service (create, submit, update draft)
  - Geographic validation middleware
  - Party affiliation validation
  - Duplicate prevention (unique constraint)

- [ ] **Day 4-6**: Document management

  - MinIO bucket setup (`candidate-applications`)
  - Document upload service
  - File type validation
  - Presigned URL generation for viewing

- [ ] **Day 7-9**: Review workflow

  - Application review service
  - Status transition state machine
  - Reviewer assignment logic
  - Approval/rejection with notes
  - Bulk approval transaction

- [ ] **Day 10-11**: Candidate creation

  - Auto-create candidate on approval
  - Candidate number assignment algorithm
  - Running mate linkage
  - Application → Candidate sync

- [ ] **Day 12-14**: Notifications & audit
  - Email notifications on status change
  - SMS notifications (optional)
  - Comprehensive audit logging
  - Application history tracking

### Frontend Implementation

- [ ] **Day 15-17**: Application portal (public)

  - Multi-step wizard component
  - Form validation (Vuelidate)
  - Document upload with progress
  - Draft auto-save to localStorage

- [ ] **Day 18-20**: Review workspace (admin)
  - Application list with filters
  - Document viewer modal
  - Approval/rejection UI
  - Bulk operations interface

### Success Criteria

- ✅ Complete end-to-end nomination workflow
- ✅ Documents upload and display correctly
- ✅ Reviewers can approve/reject applications
- ✅ Candidates auto-created with correct data
- ✅ Notifications delivered
- ✅ No duplicate applications possible

---

## 🤝 Phase 3: Coalition Management (Weeks 5-6)

**Priority**: MEDIUM  
**Dependencies**: Phase 2 complete

### Backend Implementation

- [ ] **Day 1-3**: Coalition CRUD

  - Coalition creation service
  - Member add/remove
  - Agreement document upload
  - Coalition activation/deactivation

- [ ] **Day 4-6**: Contest allocation

  - Allocation proposal service
  - Validation (member must be in coalition)
  - Approval workflow
  - Conflict detection

- [ ] **Day 7-8**: Dispute management

  - Dispute creation
  - Status tracking
  - Resolution workflow

- [ ] **Day 9-10**: Integration with nominations
  - Coalition-aware candidate filtering
  - Allocated contest enforcement
  - Party seat-sharing rules

### Frontend Implementation

- [ ] **Day 11-13**: Coalition management UI

  - Coalition list and form
  - Member management interface
  - Agreement upload

- [ ] **Day 14**: Contest allocation matrix
  - Visual allocation grid
  - Drag-drop assignment
  - Approval buttons

### Success Criteria

- ✅ Coalitions can be formed and managed
- ✅ Contests allocated to coalition parties
- ✅ Disputes tracked
- ✅ Integration with candidate applications works

---

## 📊 Phase 4: Advanced Features & Optimization (Weeks 7-8)

**Priority**: MEDIUM  
**Dependencies**: Phase 3 complete

### Results Enhancement

- [ ] **Day 1-2**: Form 34A/B/C tracking

  - ResultForm model implementation
  - Scanned form upload
  - Form number tracking

- [ ] **Day 3-4**: Verification chain

  - Blockchain-style verification
  - Multi-level verification workflow
  - Integrity checking

- [ ] **Day 5-6**: Result integrity features
  - Vote validation against registered voters
  - Turnout anomaly detection
  - Automated incident creation

### Performance Optimization

- [ ] **Day 7-8**: Caching strategy

  - Redis cache implementation
  - Cache invalidation patterns
  - Results caching (5-min TTL)

- [ ] **Day 9-10**: Database optimization

  - Query analysis (EXPLAIN ANALYZE)
  - Index creation
  - Materialized view refresh optimization

- [ ] **Day 11-12**: Load testing
  - k6/Artillery test scripts
  - Concurrent result submission tests
  - Performance bottleneck identification

### Special Features

- [ ] **Day 13-14**: Diaspora/special stations
  - Station type implementation
  - Geographic handling for diaspora
  - Special reporting

---

## 🧪 Phase 5: Testing & Production Readiness (Week 9)

**Priority**: CRITICAL

### Testing

- [ ] **Day 1-2**: Unit tests

  - Service layer tests (80%+ coverage)
  - Validation tests
  - Business logic tests

- [ ] **Day 3-4**: Integration tests

  - API endpoint tests
  - Database transaction tests
  - File upload tests

- [ ] **Day 5**: E2E tests
  - Complete user journeys
  - Application submission flow
  - Results submission flow

### Security & Compliance

- [ ] **Day 6**: Security audit
  - RLS policy verification
  - Input validation check
  - Rate limiting tests
  - GDPR compliance review

### Documentation & Training

- [ ] **Day 7**: Technical documentation

  - API documentation (Swagger/OpenAPI)
  - Database schema diagrams
  - Deployment guide

- [ ] **Day 8**: User documentation

  - Admin user guide
  - Candidate application guide
  - Field observer manual

- [ ] **Day 9**: Production deployment
  - Environment setup
  - Database migration
  - Smoke tests
  - Monitoring setup

### Success Criteria

- ✅ All tests passing (unit, integration, E2E)
- ✅ Security audit passed
- ✅ Documentation complete
- ✅ Production deployment successful
- ✅ Monitoring and alerting configured

🧪 Testing Strategy & Requirements

## Functional Testing

**TR-1**: End-to-end election workflow

```typescript
// Jest/Supertest integration test
describe('Election Workflow E2E', () => {
  it('should complete full election cycle', async () => {
    // 1. Create election
    const election = await request(app)
      .post('/api/v1/elections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        electionCode: 'GE-2027',
        title: '2027 General Election',
        electionType: 'general_election',
        electionDate: '2027-08-08',
      });

    expect(election.status).toBe(201);

    // 2. Create contests
    const contest = await request(app)
      .post(`/api/v1/elections/${election.body.id}/contests`)
      .send({
        positionName: 'President',
        contestType: 'presidential',
      });

    // 3. Submit candidate application
    // 4. Approve application
    // 5. Submit results
    // 6. Verify results
    // ... full workflow
  });
});
```

**TR-2**: Candidate nomination validation

- Duplicate application prevention
- Geographic scope validation
- Party affiliation rules
- Running mate validation
- Document upload requirements

**TR-3**: Coalition management scenarios

- Multi-party coalition formation
- Contest allocation conflicts
- Dispute resolution workflow
- Party exit from coalition

**TR-4**: PostGIS geographic validation

```typescript
test('Should validate ward-constituency-county chain', async () => {
  const isValid = await validateGeographicChain(
    wardId,
    constituencyId,
    countyId
  );
  expect(isValid).toBe(true);
});
```

## Integration Testing

**TR-5**: Authentication & ABAC integration

```typescript
describe('Auth Integration', () => {
  it('should enforce RLS policies', async () => {
    // Field observer should only see their assigned results
    const results = await prisma.electionResult.findMany({
      where: {
        /* RLS context set */
      },
    });

    expect(
      results.every((r) => r.pollingStationId === assignedStation.id)
    ).toBe(true);
  });
});
```

**TR-6**: Geographic data consistency

- Foreign key integrity (ward → constituency → county)
- Cascading deletes behavior
- Soft delete handling
- Geographic hierarchy queries

**TR-7**: Audit system integration

```typescript
test('Should create audit log for all mutations', async () => {
  const initialCount = await prisma.auditLog.count();

  await createCandidateApplication(testData);

  const finalCount = await prisma.auditLog.count();
  expect(finalCount).toBe(initialCount + 1);

  const log = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  expect(log.action).toBe('create');
  expect(log.entityType).toBe('candidate_application');
});
```

**TR-8**: External API integrations

- Clearance APIs (EACC, HELB, KRA) - optional/future
- Voter registration lookup - optional/future
- Circuit breaker functionality for external services
- Manual fallbacks for all integrations

## Performance Testing

**TR-9**: Load testing with k6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 10000 }, // Peak load
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
    http_req_failed: ['rate<0.01'], // <1% errors
  },
};

export default function () {
  const res = http.post(
    'http://localhost:3000/api/v1/results',
    JSON.stringify(resultData),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${__ENV.TOKEN}`,
      },
    }
  );

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**TR-10**: Result aggregation performance

```sql
-- Performance test query
EXPLAIN ANALYZE
SELECT * FROM live_results_view
WHERE election_id = '...'
ORDER BY total_votes DESC;

-- Target: < 2 seconds execution time
-- Expected plan: Index Scan + Parallel Aggregate
```

**TR-11**: Database stress testing

- Concurrent INSERT performance (results)
- Partition pruning effectiveness
- Index usage verification
- Connection pool exhaustion scenarios

**TR-12**: Mobile PWA performance (Lighthouse)

- Performance score: > 90
- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.8s
- Offline functionality
- Service Worker caching

## Security Testing

**TR-13**: Access control validation

```typescript
describe('Access Control', () => {
  it('should prevent unauthorized access', async () => {
    const response = await request(app)
      .delete('/api/v1/elections/123')
      .set('Authorization', `Bearer ${observerToken}`);

    expect(response.status).toBe(403);
  });

  it('should enforce geographic scope', async () => {
    // Observer in County A tries to submit result in County B
    const response = await submitResult(countyBStation, observerAToken);
    expect(response.status).toBe(403);
  });
});
```

**TR-14**: Encryption verification

- PII fields encrypted at rest
- MinIO server-side encryption enabled
- TLS/SSL for data in transit
- Encryption key rotation

**TR-15**: Audit trail completeness

```typescript
test('Audit trail should capture all required fields', async () => {
  await updateElectionStatus(electionId, 'active');

  const auditLog = await prisma.auditLog.findFirst({
    where: {
      entityType: 'election',
      entityId: electionId,
      action: 'update',
    },
  });

  expect(auditLog).toMatchObject({
    userId: expect.any(String),
    oldValues: expect.objectContaining({ status: 'draft' }),
    newValues: expect.objectContaining({ status: 'active' }),
    ipAddress: expect.any(String),
    userAgent: expect.any(String),
    requestId: expect.any(String),
  });
});
```

**TR-16**: Tamper detection

```typescript
test('Should detect tampered results', async () => {
  const result = await prisma.electionResult.findFirst();

  // Manually alter vote count
  await prisma.$executeRaw`
    UPDATE election_results 
    SET votes = votes + 100 
    WHERE id = ${result.id}
  `;

  const tampered = await prisma.electionResult.findUnique({
    where: { id: result.id },
  });

  const isValid = verifyResultSignature(tampered);
  expect(isValid).toBe(false); // Signature should not match
});
```

📈 Success Metrics & KPIs

## Technical Metrics

**System Reliability**

- ✅ Zero critical bugs in production after 30-day stabilization period
- ✅ 99.9% system availability (monitored via Prometheus/Grafana)
- ✅ Mean Time Between Failures (MTBF): > 720 hours
- ✅ Mean Time To Recovery (MTTR): < 15 minutes

**Performance Benchmarks**

- ✅ API response time p95: < 500ms (actual target: 200ms median)
- ✅ Result aggregation queries: < 2 seconds
- ✅ Database query time p95: < 100ms
- ✅ Concurrent user support: 10,000+ simultaneous connections
- ✅ Result submissions: 1,000+ per minute sustained

**Data Integrity**

- ✅ Successful data migration with zero data loss
- ✅ 100% audit trail coverage for critical operations
- ✅ Zero tampered results (signature verification 100% pass rate)
- ✅ Backup success rate: 100% (with weekly restore tests)

**Code Quality**

- ✅ Unit test coverage: > 80%
- ✅ Integration test coverage: > 70%
- ✅ Zero high/critical severity security vulnerabilities (Snyk/SonarQube)
- ✅ Code review approval: 100% of PRs

## Business Metrics

**System Coverage**

- ✅ 100% of polling stations supported (47 counties, ~46,000 stations)
- ✅ All 6 contest types functional (Presidential → County Assembly)
- ✅ Support for 50,000+ candidates
- ✅ Coalition management for 10+ major political alliances

**Process Digitalization**

- ✅ 100% digital nomination workflow (zero paper applications)
- ✅ Application approval time: < 48 hours average
- ✅ Candidate profile publication: < 1 hour after approval
- ✅ Result submission to verification: < 30 minutes

**Results Accuracy**

- ✅ Result verification completion: > 95% within 24 hours
- ✅ Result discrepancy rate: < 1%
- ✅ Disputed results: < 0.5%
- ✅ Results published publicly: < 2 hours after final verification

## User Satisfaction Metrics

**Usability**

- ✅ Election officials can complete tasks without IT support (90% success rate)
- ✅ Candidates successfully submit applications digitally (95% completion rate)
- ✅ System Net Promoter Score (NPS): > 50
- ✅ Task completion time reduction: 60% vs. manual process

**Accessibility**

- ✅ Mobile app offline functionality: 100% feature parity
- ✅ PWA Lighthouse score: > 90
- ✅ WCAG 2.1 AA compliance: 100% of pages
- ✅ Multi-language support: English + Swahili

**Training & Support**

- ✅ User training completion: 100% of election officials
- ✅ Support ticket response time: < 2 hours
- ✅ Support ticket resolution: < 24 hours average
- ✅ Self-service documentation usage: > 70% of queries

---

🛡️ Risk Management & Mitigation Strategies

## High-Risk Items

### Risk 1: Data Migration Complexity ⚠️ HIGH

**Probability**: Medium | **Impact**: Critical

**Description**:

- Migration of existing elections, candidates, and results data
- Schema changes to existing tables (Election, ElectionContest, Candidate)
- Risk of data loss or corruption during migration

**Mitigation Strategies**:

1. **Pre-Migration**:
   - Complete database backup (full + transaction logs)
   - Migration dry-run on staging environment
   - Data validation scripts to verify integrity
2. **During Migration**:

   ```typescript
   // Migration with rollback capability
   async function migrateWithRollback() {
     const transaction = await prisma.$transaction(
       async (tx) => {
         // Step 1: Backup existing data
         await backupExistingData(tx);

         // Step 2: Run migrations
         await runMigrations(tx);

         // Step 3: Validate data integrity
         const isValid = await validateMigration(tx);

         if (!isValid) {
           throw new Error('Migration validation failed');
         }

         return { success: true };
       },
       {
         maxWait: 300000, // 5 minutes
         timeout: 600000, // 10 minutes
       }
     );
   }
   ```

3. **Post-Migration**:
   - Automated validation queries
   - Manual spot-checks by domain experts
   - Rollback plan tested and ready (< 1 hour rollback time)

**Contingency Plan**:

- Keep old schema parallel for 7 days
- Read-only access to old data during transition
- Emergency rollback procedure documented

---

### Risk 2: Performance Under Election Load ⚠️ HIGH

**Probability**: Medium | **Impact**: High

**Description**:

- 10,000+ concurrent users during results period
- Potential database bottlenecks
- API server resource exhaustion

**Mitigation Strategies**:

1. **Load Testing** (pre-production):

   - k6 scripts simulating 15,000 concurrent users (150% of target)
   - Sustained load testing (4 hours)
   - Spike testing (sudden traffic bursts)

2. **Performance Optimizations**:

   - Connection pooling (PgBouncer)
   - Redis caching (5-min TTL for results)
   - Materialized views (auto-refresh)
   - CDN for static assets

3. **Monitoring & Alerting**:

   ```yaml
   # Prometheus alerting rules
   groups:
     - name: performance
       rules:
         - alert: HighResponseTime
           expr: http_request_duration_seconds{quantile="0.95"} > 0.5
           for: 5m
           annotations:
             summary: 'API response time exceeds 500ms'

         - alert: HighCPUUsage
           expr: node_cpu_usage > 80
           for: 5m
           annotations:
             summary: 'CPU usage above 80%'
   ```

**Contingency Plan**:

- Auto-scaling ready (horizontal scaling)
- Read replicas on standby
- Graceful degradation (disable non-critical features)

---

### Risk 3: Security Vulnerabilities ⚠️ HIGH

**Probability**: Low | **Impact**: Critical

**Description**:

- Unauthorized access to sensitive candidate data
- SQL injection vulnerabilities
- Session hijacking
- Result tampering

**Mitigation Strategies**:

1. **Prevention**:

   - Parameterized queries (Prisma ORM)
   - Input validation (Zod schemas)
   - Rate limiting (Redis-based)
   - PII encryption (AES-256-GCM)
   - Row-Level Security (PostgreSQL RLS)

2. **Detection**:

   - Security audit (pre-production)
   - Penetration testing (by third party)
   - Automated vulnerability scanning (Snyk, OWASP ZAP)
   - Real-time anomaly detection

3. **Response**:
   - Incident response playbook
   - Security monitoring (24/7 during elections)
   - Breach notification procedure (< 4 hours)

**Contingency Plan**:

- Immediate system lockdown capability
- Forensic logging enabled
- Hot backup for emergency restore

---

## Medium-Risk Items

### Risk 4: User Adoption Resistance 🟡 MEDIUM

**Probability**: Medium | **Impact**: Medium

**Mitigation**:

- Comprehensive training program (online + in-person)
- User-friendly UI with tooltips
- 24/7 helpdesk during elections
- Champions program (power users)

### Risk 5: Integration Issues 🟡 MEDIUM

**Probability**: Medium | **Impact**: Medium

**Mitigation**:

- API contracts with versioning
- Fallback mechanisms for external services
- Circuit breakers for resilience
- Extensive integration testing

### Risk 6: Timeline Pressure 🟡 MEDIUM

**Probability**: High | **Impact**: Low

**Mitigation**:

- Agile sprints with demos
- Feature prioritization (MoSCoW method)
- Technical debt tracking
- Contingency buffer (20% extra time)

---

## Low-Risk Items

### Risk 7: Browser Compatibility 🟢 LOW

**Probability**: Low | **Impact**: Low

**Mitigation**: Modern browser stack (Chrome, Firefox, Safari), polyfills for older browsers

### Risk 8: Documentation Gaps 🟢 LOW

**Probability**: Medium | **Impact**: Low

**Mitigation**: Living documentation, API docs auto-generated, knowledge base

---

📋 Acceptance Criteria & Sign-Off

## Module Acceptance Criteria

### Database & Schema

- ✅ All Prisma migrations run successfully without errors
- ✅ New enums (ContestType, ApplicationStatus, etc.) defined
- ✅ All new models created with proper relations
- ✅ Existing models enhanced with new fields
- ✅ Database indexes created for performance
- ✅ RLS policies applied and tested
- ✅ Materialized views functional
- ✅ PostGIS spatial columns working
- ✅ Data migration completes with zero loss
- ✅ Rollback procedure tested and documented

### Backend Services

- ✅ All CRUD operations functional for new models
- ✅ Geographic validation working (PostGIS queries)
- ✅ Application workflow state machine implemented
- ✅ Coalition management service complete
- ✅ Result integrity features operational
- ✅ File upload to MinIO working
- ✅ Cache invalidation patterns correct
- ✅ Rate limiting enforced
- ✅ Error handling consistent across all endpoints
- ✅ API documentation complete (Swagger/OpenAPI)

### Security & Compliance

- ✅ RLS policies enforce access control
- ✅ PII fields encrypted at rest
- ✅ Input validation on all endpoints (Zod)
- ✅ Audit logs capture all critical operations
- ✅ Result signatures validate correctly
- ✅ Geographic scope enforcement working
- ✅ GDPR anonymization function tested
- ✅ Security audit passed (no high/critical issues)
- ✅ Penetration testing completed

### Frontend Integration

- ✅ All admin interfaces functional
- ✅ Public application portal working
- ✅ Mobile PWA offline-capable
- ✅ Forms validate correctly
- ✅ Document upload UI working
- ✅ Real-time updates via WebSocket
- ✅ Accessibility WCAG 2.1 AA compliant
- ✅ Multi-language support working (EN/SW)

### Performance & Reliability

- ✅ API response time p95 < 500ms
- ✅ Result aggregation < 2 seconds
- ✅ Load testing passed (10,000 concurrent users)
- ✅ Database query performance optimized
- ✅ Caching strategy effective
- ✅ Health checks responding correctly
- ✅ Monitoring dashboards configured
- ✅ Alerting rules active

### Testing

- ✅ Unit tests: > 80% coverage
- ✅ Integration tests: > 70% coverage
- ✅ E2E tests: All critical paths covered
- ✅ Load tests passed
- ✅ Security tests passed
- ✅ Accessibility tests passed

---

## Feature Acceptance Checklist

### Election Setup

- [ ] Admin can create election with all required fields
- [ ] Admin can add contests with geographic scoping
- [ ] Contest type validation works correctly
- [ ] Election status workflow transitions correctly
- [ ] Dates validate logically (nomination before election)

### Candidate Nomination

- [ ] Candidate can submit application via public portal
- [ ] Documents upload successfully to MinIO
- [ ] Geographic validation prevents invalid submissions
- [ ] Party affiliation rules enforced
- [ ] Duplicate applications prevented
- [ ] Reviewer can approve/reject applications
- [ ] Candidate auto-created on approval with correct data
- [ ] Candidate numbers assigned correctly
- [ ] Notifications sent on status changes

### Coalition Management

- [ ] Admin can create coalition
- [ ] Parties can be added/removed from coalition
- [ ] Contest allocation works correctly
- [ ] Allocation conflicts detected
- [ ] Disputes can be tracked
- [ ] Coalition-aware filtering works

### Results Management

- [ ] Field observer can submit result via mobile
- [ ] GPS validation enforces proximity
- [ ] Result signature generated correctly
- [ ] Vote count validation works
- [ ] Turnout anomalies detected
- [ ] Verification workflow functional
- [ ] Public results API returns correct data
- [ ] Results cached appropriately
- [ ] Live results update in real-time

---

## Production Readiness Checklist

### Infrastructure

- [ ] Docker Compose services all healthy
- [ ] Database backups scheduled (daily, weekly, monthly)
- [ ] Backup restore tested successfully
- [ ] PgBouncer connection pooling configured
- [ ] Redis cache operational
- [ ] MinIO buckets created and accessible
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules configured
- [ ] Load balancer (if applicable) configured

### Monitoring & Observability

- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards created
- [ ] Alert rules configured
- [ ] Log aggregation working (if applicable)
- [ ] Error tracking configured (Sentry/similar)
- [ ] Uptime monitoring active
- [ ] Performance monitoring baselines set

### Documentation

- [ ] API documentation published (Swagger)
- [ ] Database schema diagrams created
- [ ] Admin user guide complete
- [ ] Candidate application guide complete
- [ ] Field observer manual complete
- [ ] Deployment runbook documented
- [ ] Incident response playbook ready
- [ ] DR procedures documented and tested

### Training & Support

- [ ] Admin training sessions conducted
- [ ] Field observer training completed
- [ ] Support team trained
- [ ] Helpdesk ticketing system ready
- [ ] Knowledge base populated
- [ ] Video tutorials created (optional)

---

🔄 Ongoing Maintenance & Support

## Post-Launch Support Plan

### Immediate Post-Launch (First 30 Days)

- 24/7 on-call engineering support
- Daily health checks and log reviews
- Weekly performance reviews
- Bi-weekly stakeholder updates
- Bug hotfix SLA: Critical (4 hours), High (24 hours)

### Steady State Operations

- Business hours support (8AM - 6PM EAT, Mon-Fri)
- 24/7 monitoring with on-call rotation
- Monthly security patches
- Quarterly feature releases
- Bi-annual load testing
- Annual DR drill

### Continuous Improvement

- Performance optimization sprints (quarterly)
- User feedback sessions (monthly)
- Feature prioritization (quarterly roadmap)
- Technical debt reduction (20% sprint capacity)
- Code quality reviews (automated + manual)

---

## Evolution Roadmap (Future Phases)

### Phase 6: Advanced Analytics (Q2 2025)

- Result trend analysis
- Voter turnout predictions
- Geographic heatmaps
- Historical comparisons
- Executive dashboards
- Export to BI tools

### Phase 7: AI/ML Integration (Q3 2025)

- Anomaly detection (ML-based)
- Fraud pattern recognition
- Automated result verification suggestions
- Natural language queries
- Predictive maintenance

### Phase 8: Enhanced Security (Q4 2025)

- Blockchain result verification
- Digital signatures for forms
- Hardware security module (HSM) integration
- Zero-knowledge proofs for privacy
- Advanced threat detection

### Phase 9: Multi-Country Support (2026)

- Configurable election types
- Multi-currency support
- Regional compliance adapters
- International observer features
- Cross-border result aggregation

---

📞 Appendix & References

## A. Kenyan Election Specifics

**Electoral Contest Hierarchy**:

1. **Presidential** (National) - 1 seat
2. **Gubernatorial** (County) - 47 seats
3. **Senatorial** (County) - 47 seats
4. **Women Representative** (County) - 47 seats
5. **National Assembly** (Constituency) - 290 seats
6. **County Assembly** (Ward) - ~1,450 seats

**Geographic Structure**:

- 47 Counties
- ~290 Constituencies
- ~1,450 Electoral Wards
- ~46,000 Polling Stations

**Coalition Politics**:

- Coalitions are formal alliances between political parties
- Seat-sharing agreements determine contest allocations
- Disputes mediated through coalition tribunals or courts
- Examples: Azimio la Umoja, Kenya Kwanza
- Managed manually through admin interface (no external API)

**Form 34 Series**:

- **Form 34A**: Polling station results declaration
- **Form 34B**: Constituency results declaration
- **Form 34C**: National results declaration

## B. Technical Stack Summary

**Backend**:

- Node.js (v18+)
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL 15 (with PostGIS)
- Redis (caching + sessions)
- MinIO (S3-compatible storage)

**Frontend**:

- Vue 3 (Composition API)
- TypeScript
- Pinia (state management)
- TailwindCSS
- Vite (build tool)
- Chart.js / D3.js (visualizations)

**Infrastructure**:

- Docker & Docker Compose
- PgBouncer (connection pooling)
- Nginx (reverse proxy)
- Prometheus + Grafana (monitoring)
- Let's Encrypt (SSL)

## C. Compliance & Standards

**Regulatory**:

- Kenyan Elections Act, 2011
- Data Protection Act, 2019
- Electoral Commission Regulations on Technology
- Public Procurement and Asset Disposal Act

**Technical Standards**:

- ISO 27001 (Information Security)
- WCAG 2.1 AA (Accessibility)
- OWASP Top 10 (Security)
- RESTful API Design Standards

**Data Protection**:

- GDPR principles (though Kenya-based)
- Right to access, rectification, erasure
- Data minimization
- Privacy by design

## 🎯 Executive Summary & Next Steps

This document provides a comprehensive technical specification for the Election Management Module, fully aligned with the existing technical infrastructure documented in `technical-considerations.txt`.

**Key Highlights**:

- ✅ **Database Architecture**: Hybrid Prisma ORM + Raw PostgreSQL with UUID-based security
- ✅ **Advanced Features**: PostGIS spatial validation, table partitioning, materialized views, RLS
- ✅ **Security-First**: Field-level encryption, tamper-evident hashing, comprehensive audit trails
- ✅ **Performance Optimized**: Redis caching, connection pooling, optimized queries
- ✅ **Production-Ready**: Complete with monitoring, backups, disaster recovery

**Implementation Timeline**: 9 weeks (5 phases)
**Technical Complexity**: High (requires database expertise, security focus, performance optimization)
**Business Impact**: Critical (enables complete digital election management)

**Immediate Next Steps**:

1. ✅ Get stakeholder sign-off on this specification
2. ✅ Set up development environment and branch
3. ✅ Begin Phase 1: Database schema implementation
4. ✅ Schedule kick-off meeting with development team
5. ✅ Set up project tracking (Jira/Linear)

**Questions or Clarifications**: Contact Technical Lead

---

**END OF DOCUMENT**

_This specification is a living document and will be updated as the implementation progresses._
