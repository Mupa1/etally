/**
 * Authentication Store
 * Pinia store for managing authentication state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/api';
import type { User, LoginRequest, RegisterRequest, AuthResponse, ChangePasswordRequest } from '@/types/auth';

const TOKEN_KEY = 'etally_access_token';
const REFRESH_TOKEN_KEY = 'etally_refresh_token';
const USER_KEY = 'etally_user';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value);
  const userRole = computed(() => user.value?.role);
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
  const isElectionManager = computed(() => 
    user.value?.role === 'super_admin' || user.value?.role === 'election_manager'
  );
  const isFieldObserver = computed(() => !!user.value?.role);
  const userFullName = computed(() => 
    user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
  );

  // Actions
  async function initialize() {
    // Load from localStorage on app start
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedRefreshToken && storedUser) {
      accessToken.value = storedToken;
      refreshToken.value = storedRefreshToken;
      user.value = JSON.parse(storedUser);

      // Verify token is still valid by fetching profile
      try {
        await fetchProfile();
      } catch (err) {
        // Token invalid, clear everything
        clearAuth();
      }
    }
  }

  async function login(credentials: LoginRequest): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post<{ data: AuthResponse }>('/auth/login', credentials);
      const { user: userData, tokens } = response.data.data;

      // Save to state
      user.value = userData;
      accessToken.value = tokens.accessToken;
      refreshToken.value = tokens.refreshToken;

      // Persist to localStorage
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(data: RegisterRequest): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post<{ data: AuthResponse }>('/auth/register', data);
      const { user: userData, tokens } = response.data.data;

      // Save to state
      user.value = userData;
      accessToken.value = tokens.accessToken;
      refreshToken.value = tokens.refreshToken;

      // Persist to localStorage
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      if (refreshToken.value) {
        await api.post('/auth/logout', { refreshToken: refreshToken.value });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
    }
  }

  async function fetchProfile(): Promise<void> {
    try {
      const response = await api.get<{ data: User }>('/auth/profile');
      user.value = response.data.data;
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data));
    } catch (err) {
      throw err;
    }
  }

  async function refreshAccessToken(): Promise<void> {
    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post<{ data: { accessToken: string } }>(
        '/auth/refresh',
        { refreshToken: refreshToken.value }
      );

      accessToken.value = response.data.data.accessToken;
      localStorage.setItem(TOKEN_KEY, response.data.data.accessToken);
    } catch (err) {
      clearAuth();
      throw err;
    }
  }

  async function changePassword(data: ChangePasswordRequest): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await api.put('/auth/change-password', data);
      // Password changed successfully, user needs to login again
      clearAuth();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Password change failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearAuth() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,

    // Getters
    isAuthenticated,
    userRole,
    isSuperAdmin,
    isElectionManager,
    isFieldObserver,
    userFullName,

    // Actions
    initialize,
    login,
    register,
    logout,
    fetchProfile,
    refreshAccessToken,
    changePassword,
    clearAuth,
  };
});
