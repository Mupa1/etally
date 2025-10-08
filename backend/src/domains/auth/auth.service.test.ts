/**
 * Authentication Service Unit Tests
 * Tests for authentication business logic
 */

import AuthService from './auth.service';
import PrismaService from '@/infrastructure/database/prisma.service';
import RedisService from '@/infrastructure/cache/redis.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/types/errors';

// Mock dependencies
jest.mock('@/infrastructure/database/prisma.service');
jest.mock('@/infrastructure/cache/redis.service');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockRedis: jest.Mocked<RedisService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nationalId: '12345678',
    email: 'test@example.com',
    phoneNumber: '+254712345678',
    firstName: 'John',
    lastName: 'Doe',
    role: 'field_observer' as any,
    isActive: true,
    lastLogin: null,
    failedLoginAttempts: 0,
    passwordHash: '$2b$12$hashedpassword',
    mfaSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock instances
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as any;

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    // Mock getInstance methods
    (PrismaService.getInstance as jest.Mock).mockReturnValue(mockPrisma);
    (RedisService.getInstance as jest.Mock).mockReturnValue(mockRedis);

    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerData = {
        nationalId: '12345678',
        email: 'newuser@example.com',
        phoneNumber: '+254712345678',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'SecurePass123!',
      };

      mockPrisma.user.findUnique = jest
        .fn()
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(null); // National ID check

      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpassword');

      mockPrisma.user.create = jest.fn().mockResolvedValue({
        ...mockUser,
        email: registerData.email,
        nationalId: registerData.nationalId,
      });

      mockPrisma.session.create = jest.fn().mockResolvedValue({
        id: 'session-id',
        userId: mockUser.id,
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      (jwt.sign as jest.Mock).mockReturnValue('access-token');

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(registerData.email);
      expect(result.tokens.accessToken).toBe('access-token');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: registerData.email,
            nationalId: registerData.nationalId,
          }),
        })
      );
    });

    it('should throw ConflictError if email already exists', async () => {
      // Arrange
      const registerData = {
        nationalId: '12345678',
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'SecurePass123!',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow(
        new ConflictError('Email already registered')
      );
    });

    it('should throw ConflictError if national ID already exists', async () => {
      // Arrange
      const registerData = {
        nationalId: '12345678',
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'SecurePass123!',
      };

      mockPrisma.user.findUnique = jest
        .fn()
        .mockResolvedValueOnce(null) // Email check passes
        .mockResolvedValueOnce(mockUser); // National ID check fails

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow(
        new ConflictError('National ID already registered')
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.session.create = jest.fn().mockResolvedValue({
        id: 'session-id',
        userId: mockUser.id,
        refreshToken: 'refresh-token',
      });
      (jwt.sign as jest.Mock).mockReturnValue('access-token');
      mockRedis.set = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(mockUser.email);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: 0,
          lastLogin: expect.any(Date),
        },
      });
    });

    it('should throw AuthenticationError for invalid email', async () => {
      // Arrange
      const loginData = {
        email: 'invalid@example.com',
        password: 'SecurePass123!',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        new AuthenticationError('Invalid email or password')
      );
    });

    it('should throw AuthenticationError for inactive user', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        new AuthenticationError('Account is deactivated')
      );
    });

    it('should throw AuthenticationError for locked account', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 5,
      });

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        new AuthenticationError('Account is temporarily locked')
      );
    });

    it('should increment failed attempts on wrong password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrisma.user.update = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        new AuthenticationError('Invalid email or password')
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });
    });

    it('should cache user data after successful login', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.session.create = jest.fn().mockResolvedValue({
        id: 'session-id',
        userId: mockUser.id,
        refreshToken: 'refresh-token',
      });
      (jwt.sign as jest.Mock).mockReturnValue('access-token');
      mockRedis.set = jest.fn().mockResolvedValue(undefined);

      // Act
      await authService.login(loginData);

      // Assert
      expect(mockRedis.set).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        mockUser,
        3600
      );
    });
  });

  describe('logout', () => {
    it('should delete session and invalidate cache', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        refreshToken,
      };

      mockPrisma.session.findUnique = jest.fn().mockResolvedValue(mockSession);
      mockPrisma.session.delete = jest.fn().mockResolvedValue(mockSession);
      mockRedis.del = jest.fn().mockResolvedValue(undefined);

      // Act
      await authService.logout(refreshToken);

      // Assert
      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { refreshToken },
      });
      expect(mockRedis.del).toHaveBeenCalledWith(`user:${mockUser.id}`);
    });

    it('should handle logout gracefully if session not found', async () => {
      // Arrange
      const refreshToken = 'invalid-token';
      mockPrisma.session.findUnique = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.logout(refreshToken)).resolves.not.toThrow();
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token with valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        user: mockUser,
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        sessionId: 'session-id',
      });
      mockPrisma.session.findUnique = jest.fn().mockResolvedValue(mockSession);
      (jwt.sign as jest.Mock).mockReturnValue('new-access-token');

      // Act
      const result = await authService.refreshAccessToken(refreshToken);

      // Assert
      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, expect.any(String));
    });

    it('should throw AuthenticationError for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow(new AuthenticationError('Invalid refresh token'));
    });

    it('should throw AuthenticationError for expired session', async () => {
      // Arrange
      const refreshToken = 'expired-token';
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        refreshToken,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
        user: mockUser,
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        sessionId: 'session-id',
      });
      mockPrisma.session.findUnique = jest.fn().mockResolvedValue(mockSession);

      // Act & Assert
      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow(
        new AuthenticationError('Refresh token expired or invalid')
      );
    });

    it('should throw AuthenticationError for inactive user', async () => {
      // Arrange
      const refreshToken = 'valid-token';
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, isActive: false },
      };

      (jwt.verify as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        sessionId: 'session-id',
      });
      mockPrisma.session.findUnique = jest.fn().mockResolvedValue(mockSession);

      // Act & Assert
      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow(new AuthenticationError('Account is deactivated'));
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userId = mockUser.id;
      const currentPassword = 'OldPass123!';
      const newPassword = 'NewPass123!';

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // Current password is correct
        .mockResolvedValueOnce(false); // New password is different
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhashedpassword');
      mockPrisma.user.update = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.session.deleteMany = jest.fn().mockResolvedValue({ count: 2 });
      mockRedis.del = jest.fn().mockResolvedValue(undefined);

      // Act
      await authService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: '$2b$12$newhashedpassword' },
      });
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockRedis.del).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('should throw NotFoundError if user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.changePassword(userId, 'OldPass123!', 'NewPass123!')
      ).rejects.toThrow(new NotFoundError('User', userId));
    });

    it('should throw AuthenticationError if current password is incorrect', async () => {
      // Arrange
      const userId = mockUser.id;
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.changePassword(userId, 'WrongPass123!', 'NewPass123!')
      ).rejects.toThrow(
        new AuthenticationError('Current password is incorrect')
      );
    });

    it('should throw ValidationError if new password is same as current', async () => {
      // Arrange
      const userId = mockUser.id;
      const password = 'SamePass123!';

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Same password

      // Act & Assert
      await expect(
        authService.changePassword(userId, password, password)
      ).rejects.toThrow(
        new ValidationError(
          'New password must be different from current password'
        )
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile from cache if available', async () => {
      // Arrange
      const userId = mockUser.id;
      mockRedis.get = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await authService.getProfile(userId);

      // Assert
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('mfaSecret');
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      // Arrange
      const userId = mockUser.id;
      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockRedis.set = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await authService.getProfile(userId);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        `user:${userId}`,
        mockUser,
        3600
      );
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundError if user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockRedis.get = jest.fn().mockResolvedValue(null);
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getProfile(userId)).rejects.toThrow(
        new NotFoundError('User', userId)
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token successfully', () => {
      // Arrange
      const token = 'valid-token';
      const payload = {
        userId: mockUser.id,
        role: 'field_observer',
        sessionId: 'session-id',
      };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      // Act
      const result = authService.verifyAccessToken(token);

      // Assert
      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    it('should throw AuthenticationError for invalid token', () => {
      // Arrange
      const token = 'invalid-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      expect(() => authService.verifyAccessToken(token)).toThrow(
        new AuthenticationError('Invalid or expired token')
      );
    });
  });
});
