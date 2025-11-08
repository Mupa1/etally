/**
 * ABAC (Attribute-Based Access Control) Interfaces
 * Type definitions for the ABAC authorization system
 */

import { UserRole, PermissionAction, ResourceType } from '@prisma/client';

/**
 * Context for access control evaluation
 * Contains all information needed to make authorization decisions
 */
export interface IAccessContext {
  // User attributes
  userId: string;
  role: UserRole;

  // Resource being accessed
  resourceType: ResourceType;
  resourceId?: string;
  action: PermissionAction;

  // Environmental attributes
  ipAddress?: string;
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: Date;

  // Resource-specific attributes
  resourceAttributes?: IResourceAttributes;
}

/**
 * Attributes of the resource being accessed
 * Used for fine-grained access control decisions
 */
export interface IResourceAttributes {
  // Ownership
  ownerId?: string;
  createdBy?: string;
  submittedBy?: string;

  // Geographic context
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
  pollingStationId?: string;

  // Election context
  electionId?: string;
  electionStatus?: string;
  contestId?: string;

  // Result context
  resultStatus?: string;
  resultLevel?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;

  // Any additional attributes
  [key: string]: any;
}

/**
 * Result of a policy evaluation
 */
export interface IPolicyEvaluationResult {
  granted: boolean;
  reason?: string;
  appliedPolicies: string[];
  evaluationTimeMs?: number;
}

/**
 * Policy condition definition
 */
export interface IPolicyConditions {
  // Time-based conditions
  timeRange?: {
    start: string | Date;
    end: string | Date;
  };

  // IP-based conditions
  ipRange?: string[];
  ipWhitelist?: string[];
  ipBlacklist?: string[];

  // Device-based conditions
  deviceTypes?: string[];
  deviceIds?: string[];

  // Location-based conditions (geofencing)
  geofence?: {
    type: 'circle' | 'polygon';
    center?: {
      lat: number;
      lng: number;
    };
    radius?: number; // in kilometers
    polygon?: Array<{ lat: number; lng: number }>;
  };

  // Election-specific conditions
  electionStatus?: string[];
  resultStatus?: string[];

  // Custom conditions
  requiresActiveElection?: boolean;
  requiresVerifiedResult?: boolean;

  // Any additional conditions
  [key: string]: any;
}

/**
 * Geographic scope definition
 */
export interface IGeographicScope {
  scopeLevel: 'national' | 'county' | 'constituency' | 'ward';
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
}

/**
 * Permission check log entry
 */
export interface IPermissionCheckLog {
  userId: string;
  resourceType: ResourceType;
  resourceId?: string;
  action: PermissionAction;
  granted: boolean;
  reason?: string;
  context?: {
    ipAddress?: string;
    deviceId?: string;
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Bulk permission check request
 */
export interface IBulkAccessCheck {
  contexts: IAccessContext[];
}

/**
 * Bulk permission check response
 */
export interface IBulkAccessCheckResult {
  results: IPolicyEvaluationResult[];
  overallGranted: boolean;
  evaluationTimeMs: number;
}
