/**
 * API Client
 * Axios-based client for backend API communication
 */

import axios from 'axios';
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
}

// Simple UUID v4 generator (fallback for environments without crypto.randomUUID)
function generateUUID(): string {
  // Try native crypto.randomUUID first (faster, more secure)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: Generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.178.72:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();

    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateUUID();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      const authStore = useAuthStore();

      // If the refresh endpoint itself failed, immediately logout (prevent infinite loop)
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.log('Refresh token invalid, logging out...');
        authStore.clearAuth();
        router.push({ name: 'login', query: { expired: 'true' } });
        return Promise.reject(error);
      }

      // Try to refresh token
      if (authStore.refreshToken && !(originalRequest as any)._retry) {
        (originalRequest as any)._retry = true;

        try {
          await authStore.refreshAccessToken();

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
          }

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user gracefully
          console.log('Token refresh failed, logging out...');
          authStore.clearAuth();
          router.push({ name: 'login', query: { expired: 'true' } });
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token or already retried, logout
        console.log('No valid refresh token, logging out...');
        authStore.clearAuth();
        router.push({ name: 'login', query: { expired: 'true' } });
      }
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || 'An unexpected error occurred';
    console.error('API Error:', errorMessage, error.response?.data);

    return Promise.reject(error);
  }
);

export default api;
