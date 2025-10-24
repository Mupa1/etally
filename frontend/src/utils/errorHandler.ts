/**
 * Enhanced Error Handling Utility
 * Provides comprehensive error handling with user-friendly messages and recovery mechanisms
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ErrorRecovery {
  canRetry: boolean;
  canFallback: boolean;
  retryDelay?: number;
  fallbackAction?: () => void;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{
    error: Error;
    context: ErrorContext;
    timestamp: string;
  }> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle errors with context and recovery options
   */
  handleError(
    error: Error | any,
    context: ErrorContext = {},
    showToast: boolean = true
  ): ErrorRecovery {
    const timestamp = new Date().toISOString();

    // Log error
    this.errorLog.push({
      error,
      context: { ...context, timestamp },
      timestamp,
    });

    // Determine recovery options
    const recovery = this.determineRecoveryOptions(error);

    // Get user-friendly message
    const userMessage = this.getUserFriendlyMessage(error, context);

    // Log to console for debugging
    console.error('Error handled:', {
      error: error.message || error,
      context,
      recovery,
      timestamp,
    });

    // Show user notification if requested
    if (showToast) {
      this.showErrorNotification(userMessage, recovery);
    }

    // Report to monitoring service
    this.reportToMonitoringService(error, context);

    return recovery;
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: any, context: ErrorContext): string {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    // Network/Connection errors
    if (this.isNetworkError(error)) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Authentication errors
    if (this.isAuthenticationError(error)) {
      return 'Your session has expired. Please log in again.';
    }

    // Permission errors
    if (this.isPermissionError(error)) {
      return 'You do not have permission to perform this action.';
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return 'Please check your input and try again.';
    }

    // Server errors
    if (this.isServerError(error)) {
      return 'The server is experiencing issues. Please try again later.';
    }

    // File upload errors
    if (this.isFileUploadError(error)) {
      return 'File upload failed. Please check the file size and format, then try again.';
    }

    // Form submission errors
    if (context.action === 'form_submission') {
      return 'Failed to submit form. Please check your input and try again.';
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Determine recovery options based on error type
   */
  private determineRecoveryOptions(error: any): ErrorRecovery {
    // Network errors - can retry
    if (this.isNetworkError(error)) {
      return {
        canRetry: true,
        canFallback: true,
        retryDelay: 2000,
      };
    }

    // Authentication errors - redirect to login
    if (this.isAuthenticationError(error)) {
      return {
        canRetry: false,
        canFallback: true,
        fallbackAction: () => {
          // Redirect to login
          window.location.href = '/agent/login';
        },
      };
    }

    // Permission errors - show message
    if (this.isPermissionError(error)) {
      return {
        canRetry: false,
        canFallback: true,
      };
    }

    // Server errors - can retry with delay
    if (this.isServerError(error)) {
      return {
        canRetry: true,
        canFallback: true,
        retryDelay: 5000,
      };
    }

    // Default - can retry
    return {
      canRetry: true,
      canFallback: true,
      retryDelay: 1000,
    };
  }

  /**
   * Show error notification to user
   */
  private showErrorNotification(
    message: string,
    recovery: ErrorRecovery
  ): void {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="flex-1">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 5000);
  }

  /**
   * Report error to monitoring service
   */
  private reportToMonitoringService(error: any, context: ErrorContext): void {
    // In a real application, you would send this to your monitoring service
    // like Sentry, LogRocket, or your own logging service
    const errorReport = {
      message: error?.message || error?.toString(),
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId,
    };

    console.log('Error reported to monitoring service:', errorReport);

    // You could implement actual error reporting here
    // Example: Sentry.captureException(error, { extra: context });
  }

  /**
   * Error type detection methods
   */
  private isNetworkError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return (
      message.includes('Network Error') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      error?.code === 'NETWORK_ERROR'
    );
  }

  private isAuthenticationError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return (
      message.includes('401') ||
      message.includes('Unauthorized') ||
      message.includes('token') ||
      error?.status === 401
    );
  }

  private isPermissionError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return (
      message.includes('403') ||
      message.includes('Forbidden') ||
      message.includes('permission') ||
      error?.status === 403
    );
  }

  private isValidationError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return (
      message.includes('validation') ||
      message.includes('required') ||
      message.includes('invalid') ||
      message.includes('format')
    );
  }

  private isServerError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return (
      message.includes('500') ||
      message.includes('Internal Server Error') ||
      message.includes('server error') ||
      error?.status === 500
    );
  }

  private isFileUploadError(error: any): boolean {
    const message = error?.message || error?.toString() || '';
    return (
      message.includes('upload') ||
      message.includes('file') ||
      message.includes('size') ||
      message.includes('format')
    );
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): Array<{
    error: Error;
    context: ErrorContext;
    timestamp: string;
  }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Export convenience functions
export function handleError(
  error: any,
  context?: ErrorContext,
  showToast?: boolean
): ErrorRecovery {
  return errorHandler.handleError(error, context, showToast);
}

export function getUserFriendlyMessage(
  error: any,
  context?: ErrorContext
): string {
  return errorHandler['getUserFriendlyMessage'](error, context);
}
