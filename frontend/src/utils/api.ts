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

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
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
    config.headers['X-Request-ID'] = crypto.randomUUID();

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
          // Refresh failed, logout user
          authStore.logout();
          router.push({ name: 'login' });
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token or already retried, logout
        authStore.logout();
        router.push({ name: 'login' });
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
