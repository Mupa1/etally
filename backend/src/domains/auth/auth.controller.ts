/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import AuthService from './auth.service';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
  firstLoginPasswordChangeSchema,
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  ChangePasswordInput,
  FirstLoginPasswordChangeInput,
} from './auth.validator';
import { ValidationError } from '@/shared/types/errors';

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register new user (Admin only)
   * POST /api/v1/auth/register
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const registerData: RegisterInput = validationResult.data;

      // Register user
      const result = await this.authService.register(registerData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const loginData: LoginInput = {
        ...validationResult.data,
        deviceInfo: {
          ...validationResult.data.deviceInfo,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        },
      };

      // Authenticate user
      const result = await this.authService.login(loginData);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      await this.authService.logout(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request body
      const validationResult = refreshTokenSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new ValidationError('Invalid refresh token format');
      }

      const { refreshToken }: RefreshTokenInput = validationResult.data;

      // Generate new access token
      const result = await this.authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user profile
   * GET /api/v1/auth/profile
   * Requires authentication
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const profile = await this.authService.getProfile(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * First-login password change
   * PUT /api/v1/auth/first-login-password-change
   * Requires authentication
   * Only for initial super admin with pending approval
   */
  firstLoginPasswordChange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate request body
      const validationResult = firstLoginPasswordChangeSchema.safeParse(
        req.body
      );

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const { newPassword }: FirstLoginPasswordChangeInput =
        validationResult.data;

      await this.authService.firstLoginPasswordChange(
        req.user.userId,
        newPassword
      );

      res.status(200).json({
        success: true,
        message:
          'Password changed successfully and account approved. Please login again with your new password.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password
   * PUT /api/v1/auth/change-password
   * Requires authentication
   */
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate request body
      const validationResult = changePasswordSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const { currentPassword, newPassword }: ChangePasswordInput =
        validationResult.data;

      await this.authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message:
          'Password changed successfully. Please login again with your new password.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all users (Admin only)
   * GET /api/v1/auth/users
   */
  listUsers = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      console.log('Listing users...');
      const users = await this.authService.listUsers();
      console.log('Users retrieved:', users.length);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
      });
    } catch (error) {
      console.error('Error in listUsers controller:', error);
      next(error);
    }
  };
}

export default AuthController;
