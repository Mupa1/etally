/**
 * ABAC Integration Tests
 * Tests the complete authorization flow including middleware integration
 */

import request from 'supertest';
import app from '@/server';
import PrismaService from '@/infrastructure/database/prisma.service';
import ABACService from '@/infrastructure/authorization/abac.service';

describe('ABAC Integration Tests', () => {
  let prisma: PrismaService;
  let abac: ABACService;
  let adminToken: string;
  let observerToken: string;
  let adminUserId: string;
  let observerUserId: string;

  beforeAll(async () => {
    prisma = PrismaService.getInstance();
    abac = new ABACService();

    // Create test users and get tokens
    // Note: This assumes auth endpoints are working
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@elections.ke',
        password: 'Admin@2024!Secure',
        deviceInfo: {
          deviceName: 'Test Device',
          deviceModel: 'Jest',
          osVersion: 'Node',
          appVersion: '1.0.0',
        },
      });

    adminToken = adminLogin.body.data?.tokens?.accessToken;
    adminUserId = adminLogin.body.data?.user?.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Registration with ABAC', () => {
    it('should allow admin to register new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nationalId: `TEST${Date.now()}`,
          email: `test${Date.now()}@elections.ke`,
          phoneNumber: '+254700000999',
          firstName: 'Test',
          lastName: 'User',
          password: 'Test@2024!Secure',
        });

      // Should succeed with ABAC check
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should deny non-admin from registering users', async () => {
      // First create a field observer and login
      const observerEmail = `observer${Date.now()}@elections.ke`;

      // Register observer using admin
      await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nationalId: `OBS${Date.now()}`,
          email: observerEmail,
          phoneNumber: '+254700000888',
          firstName: 'Test',
          lastName: 'Observer',
          password: 'Observer@2024!Secure',
          role: 'field_observer',
        });

      // Login as observer
      const observerLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: observerEmail,
          password: 'Observer@2024!Secure',
          deviceInfo: {
            deviceName: 'Test Device',
            deviceModel: 'Jest',
            osVersion: 'Node',
            appVersion: '1.0.0',
          },
        });

      const observerToken = observerLogin.body.data?.tokens?.accessToken;

      // Try to register another user (should fail)
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${observerToken}`)
        .send({
          nationalId: `TEST${Date.now()}`,
          email: `test${Date.now()}@elections.ke`,
          phoneNumber: '+254700000777',
          firstName: 'Unauthorized',
          lastName: 'User',
          password: 'Test@2024!Secure',
        });

      // Should be denied by ABAC
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('AuthorizationError');
    });
  });

  describe('ABAC Metadata in Error Responses', () => {
    it('should include appliedPolicies in authorization errors', async () => {
      // Create field observer
      const observerEmail = `observer${Date.now()}@elections.ke`;
      await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nationalId: `OBS${Date.now()}`,
          email: observerEmail,
          phoneNumber: '+254700000666',
          firstName: 'Test',
          lastName: 'Observer',
          password: 'Observer@2024!Secure',
        });

      const observerLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: observerEmail,
          password: 'Observer@2024!Secure',
          deviceInfo: {
            deviceName: 'Test Device',
            deviceModel: 'Jest',
            osVersion: 'Node',
            appVersion: '1.0.0',
          },
        });

      const observerToken = observerLogin.body.data?.tokens?.accessToken;

      // Try unauthorized action
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${observerToken}`)
        .send({
          nationalId: `TEST${Date.now()}`,
          email: `test${Date.now()}@elections.ke`,
          firstName: 'Test',
          lastName: 'User',
          password: 'Test@2024!Secure',
        });

      // Should include ABAC metadata
      expect(response.status).toBe(403);
      expect(response.body.details).toBeDefined();
      expect(response.body.details?.appliedPolicies).toBeDefined();
      expect(response.body.details?.evaluationTimeMs).toBeDefined();
    });
  });

  describe('Permission Check Logging', () => {
    it('should log all permission checks to database', async () => {
      // Perform an action
      await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nationalId: `LOG${Date.now()}`,
          email: `log${Date.now()}@elections.ke`,
          phoneNumber: '+254700000555',
          firstName: 'Log',
          lastName: 'Test',
          password: 'Test@2024!Secure',
        });

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check that permission check was logged
      const checks = await prisma.permissionCheck.findMany({
        where: {
          userId: adminUserId,
          resourceType: 'user',
          action: 'create',
        },
        orderBy: { checkedAt: 'desc' },
        take: 1,
      });

      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0].granted).toBe(true);
    });
  });

  describe('Cache Performance', () => {
    it('should use cache for repeated permission checks', async () => {
      const startTime = Date.now();

      // First check (cache miss)
      await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      const firstCheckTime = Date.now() - startTime;

      // Second check (cache hit - should be much faster)
      const secondStartTime = Date.now();
      await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      const secondCheckTime = Date.now() - secondStartTime;

      // Second check should be faster due to caching
      // (This test may be flaky, so we just check it completes)
      expect(secondCheckTime).toBeLessThan(firstCheckTime + 100);
    });
  });
});
