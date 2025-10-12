/**
 * Authentication Service
 * Handles authentication business logic including login, registration, and token management
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import PrismaService from '@/infrastructure/database/prisma.service';
import RedisService from '@/infrastructure/cache/redis.service';
import {
  IAuthTokens,
  IAccessTokenPayload,
  IRefreshTokenPayload,
  ILoginRequest,
  IRegisterRequest,
  IDeviceInfo,
  IAuthResponse,
} from '@/shared/interfaces/auth.interface';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/types/errors';

class AuthService {
  private prisma: PrismaService;
  private redis: RedisService;
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_EXPIRY: string;
  private readonly SALT_ROUNDS = 12;

  constructor() {
    this.prisma = PrismaService.getInstance();
    this.redis = RedisService.getInstance();
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';

    if (
      this.JWT_SECRET === 'your-secret-key' ||
      this.JWT_REFRESH_SECRET === 'your-refresh-secret-key'
    ) {
      console.warn(
        '⚠️  WARNING: Using default JWT secrets. Set JWT_SECRET and JWT_REFRESH_SECRET in production!'
      );
    }
  }

  /**
   * Register a new user
   *
   * @param registerData - User registration data
   * @returns Created user (without password) and auth tokens
   * @throws ConflictError if email or national ID already exists
   */
  async register(registerData: IRegisterRequest): Promise<IAuthResponse> {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: registerData.email },
    });

    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    // Check if national ID already exists
    const existingNationalId = await this.prisma.user.findUnique({
      where: { nationalId: registerData.nationalId },
    });

    if (existingNationalId) {
      throw new ConflictError('National ID already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      registerData.password,
      this.SALT_ROUNDS
    );

    // Create user
    const user = await this.prisma.user.create({
      data: {
        nationalId: registerData.nationalId,
        email: registerData.email,
        phoneNumber: registerData.phoneNumber,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        passwordHash,
        role: 'field_observer', // Default role
      },
    });

    // Generate tokens
    const deviceInfo: IDeviceInfo = {
      ip: undefined,
      userAgent: undefined,
    };

    const tokens = await this.generateTokens(user.id, user.role, deviceInfo);

    // Return user without sensitive data
    const {
      passwordHash: _,
      mfaSecret: __,
      failedLoginAttempts: ___,
      ...userData
    } = user;
    const safeUser = {
      ...userData,
      phoneNumber: userData.phoneNumber ?? undefined,
      lastLogin: userData.lastLogin ?? undefined,
      deletedAt: userData.deletedAt ?? undefined,
      deletedBy: userData.deletedBy ?? undefined,
    };

    return {
      user: safeUser,
      tokens,
    };
  }

  /**
   * Login user
   *
   * @param loginData - Login credentials
   * @returns User data and auth tokens
   * @throws AuthenticationError if credentials are invalid
   */
  async login(loginData: ILoginRequest): Promise<IAuthResponse> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: loginData.email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Check for account lockout (after 5 failed attempts)
    if (user.failedLoginAttempts >= 5) {
      throw new AuthenticationError(
        'Account is temporarily locked due to multiple failed login attempts. Please contact support.'
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      loginData.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      // Increment failed login attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });

      throw new AuthenticationError('Invalid email or password');
    }

    // Reset failed attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLogin: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.role,
      loginData.deviceInfo
    );

    // Cache user data for quick access
    await this.redis.set(`user:${user.id}`, user, 3600); // 1 hour

    // Check if this is first super admin login requiring password change
    let requiresPasswordChange = false;
    if (
      user.role === 'super_admin' &&
      (user as any).registrationStatus === 'pending_approval'
    ) {
      // Check if there are any other approved super admins
      const approvedSuperAdmins = await this.prisma.user.count({
        where: {
          role: 'super_admin',
          registrationStatus: 'approved' as any,
          isActive: true,
        },
      });

      // If no approved super admins exist, this is the first login
      if (approvedSuperAdmins === 0) {
        requiresPasswordChange = true;
      }
    }

    // Return user without sensitive data
    const {
      passwordHash: _,
      mfaSecret: __,
      failedLoginAttempts: ___,
      ...userData
    } = user;
    const safeUser = {
      ...userData,
      phoneNumber: userData.phoneNumber ?? undefined,
      lastLogin: userData.lastLogin ?? undefined,
      deletedAt: userData.deletedAt ?? undefined,
      deletedBy: userData.deletedBy ?? undefined,
    };

    return {
      user: safeUser,
      tokens,
      requiresPasswordChange,
    };
  }

  /**
   * Logout user (invalidate session)
   *
   * @param refreshToken - Refresh token to invalidate
   */
  async logout(refreshToken: string): Promise<void> {
    // Find and delete session
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
    });

    if (session) {
      await this.prisma.session.delete({
        where: { refreshToken },
      });

      // Invalidate cached user data
      await this.redis.del(`user:${session.userId}`);
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Valid refresh token
   * @returns New access token
   * @throws AuthenticationError if refresh token is invalid or expired
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    // Verify refresh token
    try {
      jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as IRefreshTokenPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Find session in database
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired or invalid');
    }

    if (!session.user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(
      session.user.id,
      session.user.role,
      session.id
    );

    return { accessToken };
  }

  /**
   * First-login password change for initial super admin
   * Changes password and approves the account
   *
   * @param userId - User ID
   * @param newPassword - New password
   * @throws AuthenticationError if user is not eligible for first-login password change
   */
  async firstLoginPasswordChange(
    userId: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Verify user is super admin with pending approval
    if (
      user.role !== 'super_admin' ||
      (user as any).registrationStatus !== 'pending_approval'
    ) {
      throw new AuthenticationError(
        'User is not eligible for first-login password change'
      );
    }

    // Verify no other approved super admins exist
    const approvedSuperAdmins = await this.prisma.user.count({
      where: {
        role: 'super_admin',
        registrationStatus: 'approved' as any,
        isActive: true,
      },
    });

    if (approvedSuperAdmins > 0) {
      throw new AuthenticationError(
        'First-login password change is no longer available'
      );
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new ValidationError(
        'New password must be different from current password'
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password and approve registration
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        registrationStatus: 'approved' as any,
      },
    });

    // Invalidate all sessions for security
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Invalidate cached user data
    await this.redis.del(`user:${userId}`);
  }

  /**
   * Change user password
   *
   * @param userId - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @throws AuthenticationError if current password is incorrect
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new ValidationError(
        'New password must be different from current password'
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all sessions for security
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Invalidate cached user data
    await this.redis.del(`user:${userId}`);
  }

  /**
   * Get user profile
   *
   * @param userId - User ID
   * @returns User profile (without sensitive data)
   * @throws NotFoundError if user not found
   */
  async getProfile(userId: string) {
    // Try cache first
    const cachedUser = await this.redis.get(`user:${userId}`);
    if (cachedUser) {
      const {
        passwordHash: _,
        mfaSecret: __,
        failedLoginAttempts: ___,
        ...safeUser
      } = cachedUser as any;
      return safeUser;
    }

    // Fetch from database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Cache for future requests
    await this.redis.set(`user:${userId}`, user, 3600);

    // Return without sensitive data
    const {
      passwordHash: _,
      mfaSecret: __,
      failedLoginAttempts: ___,
      ...safeUser
    } = user;
    return safeUser;
  }

  /**
   * Generate access and refresh tokens
   *
   * @param userId - User ID
   * @param role - User role
   * @param deviceInfo - Device information
   * @returns Access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    role: string,
    deviceInfo?: IDeviceInfo
  ): Promise<IAuthTokens> {
    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session in database
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
        deviceInfo: deviceInfo ? JSON.parse(JSON.stringify(deviceInfo)) : null,
        ipAddress: deviceInfo?.ip,
        userAgent: deviceInfo?.userAgent,
      },
    });

    // Generate access token
    const accessToken = this.generateAccessToken(userId, role, session.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate JWT access token
   *
   * @param userId - User ID
   * @param role - User role
   * @param sessionId - Session ID
   * @returns JWT access token
   */
  private generateAccessToken(
    userId: string,
    role: string,
    sessionId: string
  ): string {
    const payload: IAccessTokenPayload = {
      userId,
      role: role as any,
      sessionId,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRY as string,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT access token
   *
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws AuthenticationError if token is invalid
   */
  verifyAccessToken(token: string): IAccessTokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as IAccessTokenPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * List all users
   * For admin user management
   */
  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }
}

export default AuthService;
