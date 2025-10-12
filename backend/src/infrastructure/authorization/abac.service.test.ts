/**
 * ABAC Service Tests
 * Unit tests for Attribute-Based Access Control service
 */

import ABACService from './abac.service';
import PrismaService from '@/infrastructure/database/prisma.service';
import RedisService from '@/infrastructure/cache/redis.service';
import { IAccessContext } from '@/shared/interfaces/abac.interface';

// Mock dependencies
jest.mock('@/infrastructure/database/prisma.service');
jest.mock('@/infrastructure/cache/redis.service');

describe('ABACService', () => {
  let abacService: ABACService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockRedis: jest.Mocked<RedisService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create service instance
    abacService = new ABACService();

    // Get mock instances
    mockPrisma = PrismaService.getInstance() as jest.Mocked<PrismaService>;
    mockRedis = RedisService.getInstance() as jest.Mocked<RedisService>;

    // Setup default mock behaviors
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue(undefined);
    mockRedis.del.mockResolvedValue(undefined);
    mockRedis.invalidatePattern.mockResolvedValue(undefined);
    mockPrisma.permissionCheck = {
      create: jest.fn().mockResolvedValue({}),
    } as any;
  });

  describe('Super Admin Access', () => {
    it('should grant full access to super admin', async () => {
      const context: IAccessContext = {
        userId: 'admin-123',
        role: 'super_admin',
        resourceType: 'election',
        action: 'delete',
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
      expect(result.appliedPolicies).toContain('super_admin_full_access');
    });
  });

  describe('RBAC - Role-Based Permissions', () => {
    it('should allow election_manager to create elections', async () => {
      const context: IAccessContext = {
        userId: 'manager-123',
        role: 'election_manager',
        resourceType: 'election',
        action: 'create',
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
    });

    it('should deny field_observer from creating elections', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election',
        action: 'create',
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('not allowed');
    });

    it('should allow field_observer to read elections', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election',
        action: 'read',
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest
          .fn()
          .mockResolvedValue([{ scopeLevel: 'national', countyId: null }]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
    });

    it('should allow field_observer to submit results', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election_result',
        action: 'submit',
        resourceAttributes: {
          electionStatus: 'active',
          countyId: 'county-123',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { scopeLevel: 'county', countyId: 'county-123' },
          ]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
    });
  });

  describe('Geographic Scope Restrictions', () => {
    it('should allow access when resource is within user county scope', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election_result',
        action: 'submit',
        resourceAttributes: {
          countyId: 'nairobi',
          electionStatus: 'active',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest.fn().mockResolvedValue([
          {
            scopeLevel: 'county',
            countyId: 'nairobi',
            constituencyId: null,
            wardId: null,
          },
        ]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
      expect(result.appliedPolicies).toContain('county_scope:nairobi');
    });

    it('should deny access when resource is outside user scope', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election_result',
        action: 'submit',
        resourceAttributes: {
          countyId: 'mombasa',
          electionStatus: 'active',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest.fn().mockResolvedValue([
          {
            scopeLevel: 'county',
            countyId: 'nairobi',
            constituencyId: null,
            wardId: null,
          },
        ]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('outside user geographic scope');
    });

    it('should allow national scope users to access any resource', async () => {
      const context: IAccessContext = {
        userId: 'manager-123',
        role: 'election_manager',
        resourceType: 'election_result',
        action: 'read',
        resourceAttributes: {
          countyId: 'any-county',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
    });
  });

  describe('Resource Ownership', () => {
    it('should allow user to update their own submission', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election_result',
        action: 'update',
        resourceAttributes: {
          submittedBy: 'observer-123',
          countyId: 'nairobi',
          electionStatus: 'active',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest
          .fn()
          .mockResolvedValue([{ scopeLevel: 'county', countyId: 'nairobi' }]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
    });

    it('should deny user from updating others submission', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election_result',
        action: 'update',
        resourceAttributes: {
          submittedBy: 'observer-456', // Different user
          countyId: 'nairobi',
          electionStatus: 'active',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest
          .fn()
          .mockResolvedValue([{ scopeLevel: 'county', countyId: 'nairobi' }]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('own submissions');
    });

    it('should allow managers to update others submissions', async () => {
      const context: IAccessContext = {
        userId: 'manager-123',
        role: 'election_manager',
        resourceType: 'election_result',
        action: 'update',
        resourceAttributes: {
          submittedBy: 'observer-456',
          countyId: 'nairobi',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
    });
  });

  describe('Time-Based Restrictions', () => {
    it('should deny result submission when election is not active', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election_result',
        action: 'submit',
        resourceAttributes: {
          electionStatus: 'completed', // Not active
          countyId: 'nairobi',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest
          .fn()
          .mockResolvedValue([{ scopeLevel: 'county', countyId: 'nairobi' }]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('active elections');
    });

    it('should deny public viewer from reading preliminary results', async () => {
      const context: IAccessContext = {
        userId: 'viewer-123',
        role: 'public_viewer',
        resourceType: 'election_result',
        action: 'read',
        resourceAttributes: {
          resultStatus: 'preliminary',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('verified results');
    });
  });

  describe('User Permission Overrides', () => {
    it('should grant access when user has explicit allow permission', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election',
        action: 'delete', // Normally not allowed
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue({
          effect: 'allow',
          action: 'delete',
          resourceType: 'election',
        }),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(true);
      expect(result.reason).toContain('user_permission');
    });

    it('should deny access when user has explicit deny permission', async () => {
      const context: IAccessContext = {
        userId: 'manager-123',
        role: 'election_manager',
        resourceType: 'election',
        action: 'create', // Normally allowed
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue({
          effect: 'deny',
          action: 'create',
          resourceType: 'election',
        }),
      } as any;

      const result = await abacService.checkAccess(context);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('user_permission');
    });
  });

  describe('Dynamic Policy Evaluation', () => {
    it('should evaluate time-based policies', async () => {
      const context: IAccessContext = {
        userId: 'observer-123',
        role: 'field_observer',
        resourceType: 'election_result',
        action: 'submit',
        timestamp: new Date('2025-08-09T10:00:00Z'),
        resourceAttributes: {
          electionStatus: 'active',
          countyId: 'nairobi',
        },
      };

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest
          .fn()
          .mockResolvedValue([{ scopeLevel: 'county', countyId: 'nairobi' }]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([
          {
            name: 'Election Hours',
            effect: 'deny',
            conditions: {
              timeRange: {
                start: '2025-08-09T06:00:00Z',
                end: '2025-08-09T17:00:00Z',
              },
            },
          },
        ]),
      } as any;

      const result = await abacService.checkAccess(context);

      // Should be denied because current time (10:00) is within denied range
      expect(result.granted).toBe(false);
    });
  });

  describe('Geofencing', () => {
    it('should allow access when within geofence circle', async () => {
      // Test geofence calculation
      const service = new ABACService();
      const geofence = {
        type: 'circle' as const,
        center: { lat: -1.286389, lng: 36.817223 }, // Nairobi center
        radius: 10, // 10 km
      };

      // Point within Nairobi (should be within 10km)
      const result = (service as any).checkGeofence(
        -1.292066,
        36.821945,
        geofence
      );

      expect(result).toBe(true);
    });

    it('should deny access when outside geofence circle', async () => {
      const service = new ABACService();
      const geofence = {
        type: 'circle' as const,
        center: { lat: -1.286389, lng: 36.817223 }, // Nairobi
        radius: 10, // 10 km
      };

      // Point far from Nairobi (should be > 10km)
      const result = (service as any).checkGeofence(
        -4.043477,
        39.668206, // Mombasa coordinates
        geofence
      );

      expect(result).toBe(false);
    });
  });

  describe('Bulk Access Checks', () => {
    it('should check multiple permissions at once', async () => {
      const contexts: IAccessContext[] = [
        {
          userId: 'observer-123',
          role: 'field_observer',
          resourceType: 'election',
          action: 'read',
        },
        {
          userId: 'observer-123',
          role: 'field_observer',
          resourceType: 'election',
          action: 'delete',
        },
      ];

      mockPrisma.userPermission = {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any;
      mockPrisma.userGeographicScope = {
        findMany: jest
          .fn()
          .mockResolvedValue([{ scopeLevel: 'national', countyId: null }]),
      } as any;
      mockPrisma.accessPolicy = {
        findMany: jest.fn().mockResolvedValue([]),
      } as any;

      const results = await abacService.checkBulkAccess(contexts);

      expect(results).toHaveLength(2);
      expect(results[0].granted).toBe(true); // Read allowed
      expect(results[1].granted).toBe(false); // Delete not allowed
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate user cache', async () => {
      await abacService.invalidateUserCache('user-123');

      expect(mockRedis.invalidatePattern).toHaveBeenCalledWith(
        'permission:user-123:*'
      );
      expect(mockRedis.del).toHaveBeenCalledWith('geo_scopes:user-123');
    });

    it('should invalidate policy cache', async () => {
      await abacService.invalidatePolicyCache();

      expect(mockRedis.invalidatePattern).toHaveBeenCalledWith('policies:*');
    });
  });

  describe('Permission Statistics', () => {
    it('should calculate permission statistics correctly', async () => {
      const mockChecks = [
        {
          action: 'read',
          resourceType: 'election',
          granted: true,
          reason: null,
        },
        {
          action: 'create',
          resourceType: 'election',
          granted: false,
          reason: 'rbac_denied',
        },
        {
          action: 'read',
          resourceType: 'election_result',
          granted: true,
          reason: null,
        },
      ];

      mockPrisma.permissionCheck = {
        findMany: jest.fn().mockResolvedValue(mockChecks),
      } as any;

      const stats = await abacService.getUserPermissionStats('user-123', 7);

      expect(stats.summary.total).toBe(3);
      expect(stats.summary.granted).toBe(2);
      expect(stats.summary.denied).toBe(1);
      expect(stats.summary.successRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance between two points correctly', () => {
      const service = new ABACService();

      // Distance from Nairobi to Mombasa (approximately 440 km)
      const distance = (service as any).calculateDistance(
        -1.286389,
        36.817223, // Nairobi
        -4.043477,
        39.668206 // Mombasa
      );

      // Distance should be around 440 km (±10%)
      expect(distance).toBeGreaterThan(400);
      expect(distance).toBeLessThan(480);
    });

    it('should return 0 for same coordinates', () => {
      const service = new ABACService();

      const distance = (service as any).calculateDistance(
        -1.286389,
        36.817223,
        -1.286389,
        36.817223
      );

      expect(distance).toBeCloseTo(0, 2);
    });
  });
});
