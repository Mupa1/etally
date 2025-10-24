/**
 * Security Utilities
 * Provides input sanitization, CSRF protection, and security validation
 */

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Kenya)
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+254|0)[17]\d{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate national ID format (Kenya)
 */
export function validateNationalId(nationalId: string): boolean {
  const nationalIdRegex = /^\d{7,8}$/;
  return nationalIdRegex.test(nationalId);
}

/**
 * Rate limiting implementation
 */
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests = 10;
  private readonly windowMs = 60000; // 1 minute

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(
      (time) => now - time < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(
      (time) => now - time < this.windowMs
    );

    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * CSRF token management
 */
export class CSRFProtection {
  private static token: string | null = null;

  static setToken(token: string): void {
    this.token = token;
  }

  static getToken(): string | null {
    return this.token;
  }

  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }
}

/**
 * File upload validation
 */
export function validateFileUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024
): {
  isValid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only images and PDF files are allowed',
    };
  }

  return { isValid: true };
}

/**
 * Input validation for forms
 */
export function validateFormInput(
  input: any,
  type: 'email' | 'phone' | 'nationalId' | 'text'
): {
  isValid: boolean;
  error?: string;
} {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Invalid input type' };
  }

  const sanitized = sanitizeInput(input);

  if (sanitized.length === 0) {
    return { isValid: false, error: 'Input is required' };
  }

  switch (type) {
    case 'email':
      return validateEmail(sanitized)
        ? { isValid: true }
        : { isValid: false, error: 'Invalid email format' };

    case 'phone':
      return validatePhoneNumber(sanitized)
        ? { isValid: true }
        : { isValid: false, error: 'Invalid phone number format' };

    case 'nationalId':
      return validateNationalId(sanitized)
        ? { isValid: true }
        : { isValid: false, error: 'Invalid national ID format' };

    case 'text':
      return { isValid: true };

    default:
      return { isValid: false, error: 'Unknown validation type' };
  }
}
