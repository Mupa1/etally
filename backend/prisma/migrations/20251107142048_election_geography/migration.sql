-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'election_manager', 'field_observer', 'public_viewer');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('general_election', 'by_election', 'referendum', 're_run_election');

-- CreateEnum
CREATE TYPE "ElectionScopeLevel" AS ENUM ('nationwide', 'county', 'constituency', 'county_assembly');

-- CreateEnum
CREATE TYPE "ReferendumQuestionType" AS ENUM ('yes_no');

-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ResultLevel" AS ENUM ('polling_station', 'ward', 'constituency', 'county', 'national');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('preliminary', 'verified', 'confirmed', 'disputed');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('full_sync', 'incremental_sync', 'media_sync');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('in_progress', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('system_alert', 'result_update', 'assignment', 'security');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('reported', 'investigating', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "UserRegistrationStatus" AS ENUM ('pending_approval', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "PartyAffiliation" AS ENUM ('main_party', 'friendly_party', 'competitor');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('create', 'read', 'update', 'delete', 'approve', 'verify', 'export', 'submit');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('election', 'election_contest', 'candidate', 'election_result', 'incident', 'user', 'audit_log', 'polling_station', 'observer');

-- CreateEnum
CREATE TYPE "PolicyEffect" AS ENUM ('allow', 'deny');

-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('registration_confirmation', 'password_setup', 'welcome', 'rejection', 'clarification_request');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'field_observer',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "passwordHash" TEXT NOT NULL,
    "mfaSecret" TEXT,
    "registrationStatus" "UserRegistrationStatus" NOT NULL DEFAULT 'pending_approval',
    "registrationSubmittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deviceInfo" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counties" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "counties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constituencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "constituencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electoral_wards" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "constituencyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "electoral_wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polling_stations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "registeredVoters" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "polling_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elections" (
    "id" TEXT NOT NULL,
    "electionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "electionType" "ElectionType" NOT NULL,
    "electionDate" TIMESTAMP(3) NOT NULL,
    "status" "ElectionStatus" NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "parentElectionId" TEXT,
    "nominationOpenDate" TIMESTAMP(3),
    "nominationCloseDate" TIMESTAMP(3),
    "partyListDeadline" TIMESTAMP(3),
    "observerCallDate" TIMESTAMP(3),
    "observerAppDeadline" TIMESTAMP(3),
    "observerReviewDeadline" TIMESTAMP(3),
    "tallyingStartDate" TIMESTAMP(3),
    "tallyingEndDate" TIMESTAMP(3),
    "resultsPublishDate" TIMESTAMP(3),
    "scopeLevel" "ElectionScopeLevel",
    "countyId" TEXT,
    "constituencyId" TEXT,
    "wardId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "election_contests" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "positionName" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "election_contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "election_referendum_questions" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "ReferendumQuestionType" NOT NULL DEFAULT 'yes_no',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "election_referendum_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "partyId" TEXT,
    "candidateNumber" INTEGER,
    "biography" TEXT,
    "photoUrl" TEXT,
    "isIndependent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "political_parties" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT,
    "certificateNumber" TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    "abbreviation" TEXT,
    "certificateDate" TEXT,
    "symbol" TEXT,
    "colors" TEXT,
    "postalAddress" TEXT,
    "headOfficeLocation" TEXT,
    "slogan" TEXT,
    "changes" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "affiliation" "PartyAffiliation",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "political_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "election_results" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "pollingStationId" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "resultLevel" "ResultLevel" NOT NULL,
    "resultStatus" "ResultStatus" NOT NULL DEFAULT 'preliminary',
    "submittedBy" TEXT NOT NULL,
    "deviceId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracyMeters" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "auditSignature" TEXT,
    "form34ANumber" TEXT,
    "form34APhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "form34AUploadedAt" TIMESTAMP(3),
    "rejectedBallots" INTEGER DEFAULT 0,
    "spoiltBallots" INTEGER DEFAULT 0,
    "submittedViaObserverApp" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "election_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_devices" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceModel" TEXT,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "lastSync" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "syncType" "SyncType" NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "syncStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncCompletedAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'in_progress',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_actions" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityData" JSONB NOT NULL,
    "actionStatus" "ActionStatus" NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "offline_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "requestId" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'medium',
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_attachments" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "deviceId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'pending',
    "processingMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'reported',
    "pollingStationId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "reportedBy" TEXT NOT NULL,
    "deviceId" TEXT,
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT,
    "templateType" "EmailTemplateType" NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_geographic_scopes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "countyId" TEXT,
    "constituencyId" TEXT,
    "wardId" TEXT,
    "scopeLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_geographic_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effect" "PolicyEffect" NOT NULL DEFAULT 'allow',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "roles" "UserRole"[],
    "resourceType" "ResourceType" NOT NULL,
    "actions" "PermissionAction"[],
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "access_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "resourceId" TEXT,
    "action" "PermissionAction" NOT NULL,
    "effect" "PolicyEffect" NOT NULL DEFAULT 'allow',
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_checks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "resourceId" TEXT,
    "action" "PermissionAction" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observer_registrations" (
    "id" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "preferredCountyId" TEXT,
    "preferredConstituencyId" TEXT,
    "preferredWardId" TEXT,
    "preferredStationId" TEXT,
    "nationalIdFrontUrl" TEXT,
    "nationalIdBackUrl" TEXT,
    "profilePhotoUrl" TEXT,
    "additionalDocs" TEXT[],
    "status" "ObserverStatus" NOT NULL DEFAULT 'pending_review',
    "trackingNumber" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDate" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "userId" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observer_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observer_assignments" (
    "id" TEXT NOT NULL,
    "observerRegistrationId" TEXT NOT NULL,
    "pollingStationId" TEXT NOT NULL,
    "assignmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),
    "deactivatedBy" TEXT,
    "deactivationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_setup_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_setup_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nationalId_key" ON "users"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_nationalId_idx" ON "users"("nationalId");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_registrationStatus_idx" ON "users"("registrationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_refreshToken_idx" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "counties_code_key" ON "counties"("code");

-- CreateIndex
CREATE INDEX "counties_code_idx" ON "counties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "constituencies_code_key" ON "constituencies"("code");

-- CreateIndex
CREATE INDEX "constituencies_countyId_idx" ON "constituencies"("countyId");

-- CreateIndex
CREATE INDEX "constituencies_code_idx" ON "constituencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "electoral_wards_code_key" ON "electoral_wards"("code");

-- CreateIndex
CREATE INDEX "electoral_wards_constituencyId_idx" ON "electoral_wards"("constituencyId");

-- CreateIndex
CREATE INDEX "electoral_wards_code_idx" ON "electoral_wards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "polling_stations_code_key" ON "polling_stations"("code");

-- CreateIndex
CREATE INDEX "polling_stations_wardId_idx" ON "polling_stations"("wardId");

-- CreateIndex
CREATE INDEX "polling_stations_code_idx" ON "polling_stations"("code");

-- CreateIndex
CREATE INDEX "polling_stations_isActive_idx" ON "polling_stations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "elections_electionCode_key" ON "elections"("electionCode");

-- CreateIndex
CREATE INDEX "elections_status_electionDate_idx" ON "elections"("status", "electionDate");

-- CreateIndex
CREATE INDEX "elections_electionType_electionDate_idx" ON "elections"("electionType", "electionDate");

-- CreateIndex
CREATE INDEX "elections_electionCode_idx" ON "elections"("electionCode");

-- CreateIndex
CREATE INDEX "elections_parentElectionId_idx" ON "elections"("parentElectionId");

-- CreateIndex
CREATE INDEX "elections_scopeLevel_countyId_constituencyId_wardId_idx" ON "elections"("scopeLevel", "countyId", "constituencyId", "wardId");

-- CreateIndex
CREATE INDEX "election_contests_electionId_idx" ON "election_contests"("electionId");

-- CreateIndex
CREATE INDEX "election_referendum_questions_electionId_idx" ON "election_referendum_questions"("electionId");

-- CreateIndex
CREATE INDEX "candidates_contestId_idx" ON "candidates"("contestId");

-- CreateIndex
CREATE INDEX "candidates_partyId_idx" ON "candidates"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "political_parties_certificateNumber_key" ON "political_parties"("certificateNumber");

-- CreateIndex
CREATE INDEX "political_parties_certificateNumber_idx" ON "political_parties"("certificateNumber");

-- CreateIndex
CREATE INDEX "political_parties_abbreviation_idx" ON "political_parties"("abbreviation");

-- CreateIndex
CREATE INDEX "political_parties_isActive_idx" ON "political_parties"("isActive");

-- CreateIndex
CREATE INDEX "political_parties_affiliation_idx" ON "political_parties"("affiliation");

-- CreateIndex
CREATE INDEX "election_results_electionId_contestId_idx" ON "election_results"("electionId", "contestId");

-- CreateIndex
CREATE INDEX "election_results_pollingStationId_idx" ON "election_results"("pollingStationId");

-- CreateIndex
CREATE INDEX "election_results_submittedBy_idx" ON "election_results"("submittedBy");

-- CreateIndex
CREATE INDEX "election_results_createdAt_idx" ON "election_results"("createdAt");

-- CreateIndex
CREATE INDEX "election_results_resultStatus_idx" ON "election_results"("resultStatus");

-- CreateIndex
CREATE INDEX "election_results_form34ANumber_idx" ON "election_results"("form34ANumber");

-- CreateIndex
CREATE INDEX "election_results_submittedViaObserverApp_idx" ON "election_results"("submittedViaObserverApp");

-- CreateIndex
CREATE UNIQUE INDEX "election_results_contestId_pollingStationId_candidateId_res_key" ON "election_results"("contestId", "pollingStationId", "candidateId", "resultLevel");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_devices_deviceId_key" ON "mobile_devices"("deviceId");

-- CreateIndex
CREATE INDEX "mobile_devices_userId_idx" ON "mobile_devices"("userId");

-- CreateIndex
CREATE INDEX "mobile_devices_deviceId_idx" ON "mobile_devices"("deviceId");

-- CreateIndex
CREATE INDEX "mobile_devices_isActive_idx" ON "mobile_devices"("isActive");

-- CreateIndex
CREATE INDEX "sync_logs_deviceId_syncStatus_idx" ON "sync_logs"("deviceId", "syncStatus");

-- CreateIndex
CREATE INDEX "sync_logs_syncStartedAt_idx" ON "sync_logs"("syncStartedAt");

-- CreateIndex
CREATE INDEX "offline_actions_deviceId_actionStatus_idx" ON "offline_actions"("deviceId", "actionStatus");

-- CreateIndex
CREATE INDEX "offline_actions_actionStatus_createdAt_idx" ON "offline_actions"("actionStatus", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_entityType_entityId_idx" ON "audit_logs"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_correlationId_idx" ON "audit_logs"("correlationId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_type_idx" ON "notifications"("userId", "type");

-- CreateIndex
CREATE INDEX "media_attachments_entityType_entityId_idx" ON "media_attachments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "media_attachments_uploadStatus_idx" ON "media_attachments"("uploadStatus");

-- CreateIndex
CREATE INDEX "media_attachments_uploadedBy_idx" ON "media_attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "incidents_pollingStationId_idx" ON "incidents"("pollingStationId");

-- CreateIndex
CREATE INDEX "incidents_reportedBy_idx" ON "incidents"("reportedBy");

-- CreateIndex
CREATE INDEX "incidents_status_severity_idx" ON "incidents"("status", "severity");

-- CreateIndex
CREATE INDEX "incidents_createdAt_idx" ON "incidents"("createdAt");

-- CreateIndex
CREATE INDEX "rate_limits_identifier_windowStart_idx" ON "rate_limits"("identifier", "windowStart");

-- CreateIndex
CREATE INDEX "rate_limits_blockedUntil_idx" ON "rate_limits"("blockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_identifier_endpoint_windowStart_key" ON "rate_limits"("identifier", "endpoint", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_templateType_key" ON "email_templates"("templateType");

-- CreateIndex
CREATE INDEX "email_templates_templateType_idx" ON "email_templates"("templateType");

-- CreateIndex
CREATE INDEX "email_templates_isActive_idx" ON "email_templates"("isActive");

-- CreateIndex
CREATE INDEX "user_geographic_scopes_userId_idx" ON "user_geographic_scopes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_geographic_scopes_userId_countyId_constituencyId_wardI_key" ON "user_geographic_scopes"("userId", "countyId", "constituencyId", "wardId");

-- CreateIndex
CREATE INDEX "access_policies_resourceType_isActive_idx" ON "access_policies"("resourceType", "isActive");

-- CreateIndex
CREATE INDEX "access_policies_priority_idx" ON "access_policies"("priority");

-- CreateIndex
CREATE INDEX "user_permissions_userId_resourceType_idx" ON "user_permissions"("userId", "resourceType");

-- CreateIndex
CREATE INDEX "user_permissions_expiresAt_idx" ON "user_permissions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_resourceType_resourceId_action_key" ON "user_permissions"("userId", "resourceType", "resourceId", "action");

-- CreateIndex
CREATE INDEX "permission_checks_userId_checkedAt_idx" ON "permission_checks"("userId", "checkedAt");

-- CreateIndex
CREATE INDEX "permission_checks_resourceType_action_idx" ON "permission_checks"("resourceType", "action");

-- CreateIndex
CREATE UNIQUE INDEX "observer_registrations_nationalId_key" ON "observer_registrations"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "observer_registrations_email_key" ON "observer_registrations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "observer_registrations_trackingNumber_key" ON "observer_registrations"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "observer_registrations_userId_key" ON "observer_registrations"("userId");

-- CreateIndex
CREATE INDEX "observer_registrations_nationalId_idx" ON "observer_registrations"("nationalId");

-- CreateIndex
CREATE INDEX "observer_registrations_email_idx" ON "observer_registrations"("email");

-- CreateIndex
CREATE INDEX "observer_registrations_status_idx" ON "observer_registrations"("status");

-- CreateIndex
CREATE INDEX "observer_registrations_trackingNumber_idx" ON "observer_registrations"("trackingNumber");

-- CreateIndex
CREATE INDEX "observer_registrations_submissionDate_idx" ON "observer_registrations"("submissionDate");

-- CreateIndex
CREATE INDEX "observer_assignments_pollingStationId_idx" ON "observer_assignments"("pollingStationId");

-- CreateIndex
CREATE INDEX "observer_assignments_isActive_idx" ON "observer_assignments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "observer_assignments_observerRegistrationId_pollingStationI_key" ON "observer_assignments"("observerRegistrationId", "pollingStationId");

-- CreateIndex
CREATE UNIQUE INDEX "password_setup_tokens_token_key" ON "password_setup_tokens"("token");

-- CreateIndex
CREATE INDEX "password_setup_tokens_token_idx" ON "password_setup_tokens"("token");

-- CreateIndex
CREATE INDEX "password_setup_tokens_userId_idx" ON "password_setup_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_setup_tokens_expiresAt_idx" ON "password_setup_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constituencies" ADD CONSTRAINT "constituencies_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electoral_wards" ADD CONSTRAINT "electoral_wards_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "constituencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polling_stations" ADD CONSTRAINT "polling_stations_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "electoral_wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_parentElectionId_fkey" FOREIGN KEY ("parentElectionId") REFERENCES "elections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "counties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "electoral_wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_contests" ADD CONSTRAINT "election_contests_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_referendum_questions" ADD CONSTRAINT "election_referendum_questions_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "election_contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "political_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "election_contests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_pollingStationId_fkey" FOREIGN KEY ("pollingStationId") REFERENCES "polling_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_devices" ADD CONSTRAINT "mobile_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "mobile_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_actions" ADD CONSTRAINT "offline_actions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "mobile_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_attachments" ADD CONSTRAINT "media_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_pollingStationId_fkey" FOREIGN KEY ("pollingStationId") REFERENCES "polling_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_geographic_scopes" ADD CONSTRAINT "user_geographic_scopes_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_geographic_scopes" ADD CONSTRAINT "user_geographic_scopes_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "counties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_geographic_scopes" ADD CONSTRAINT "user_geographic_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_geographic_scopes" ADD CONSTRAINT "user_geographic_scopes_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "electoral_wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_registrations" ADD CONSTRAINT "observer_registrations_preferredConstituencyId_fkey" FOREIGN KEY ("preferredConstituencyId") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_registrations" ADD CONSTRAINT "observer_registrations_preferredCountyId_fkey" FOREIGN KEY ("preferredCountyId") REFERENCES "counties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_registrations" ADD CONSTRAINT "observer_registrations_preferredStationId_fkey" FOREIGN KEY ("preferredStationId") REFERENCES "polling_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_registrations" ADD CONSTRAINT "observer_registrations_preferredWardId_fkey" FOREIGN KEY ("preferredWardId") REFERENCES "electoral_wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_registrations" ADD CONSTRAINT "observer_registrations_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_registrations" ADD CONSTRAINT "observer_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_assignments" ADD CONSTRAINT "observer_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_assignments" ADD CONSTRAINT "observer_assignments_observerRegistrationId_fkey" FOREIGN KEY ("observerRegistrationId") REFERENCES "observer_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observer_assignments" ADD CONSTRAINT "observer_assignments_pollingStationId_fkey" FOREIGN KEY ("pollingStationId") REFERENCES "polling_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_setup_tokens" ADD CONSTRAINT "password_setup_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
