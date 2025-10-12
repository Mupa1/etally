/**
 * Vue Router Configuration
 * Application routing with authentication guards
 */

import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresAuth: false, layout: 'auth' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/elections',
    name: 'elections',
    component: () => import('@/views/elections/ElectionsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/elections/create',
    name: 'election-create',
    component: () => import('@/views/elections/ElectionCreateView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin', 'election_manager'],
    },
  },
  {
    path: '/elections/:id',
    name: 'election-detail',
    component: () => import('@/views/elections/ElectionDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/candidates',
    name: 'candidates',
    component: () => import('@/views/candidates/CandidatesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/views/results/ResultsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/results/live',
    name: 'results-live',
    component: () => import('@/views/results/LiveResultsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true },
  },
  // Admin Routes
  {
    path: '/admin/policies',
    name: 'admin-policies',
    component: () => import('@/views/admin/PolicyManagementView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
  {
    path: '/admin/scopes',
    name: 'admin-scopes',
    component: () => import('@/views/admin/ScopeManagementView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
  {
    path: '/admin/permissions',
    name: 'admin-permissions',
    component: () => import('@/views/admin/PermissionManagementView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
  {
    path: '/admin/audit',
    name: 'admin-audit',
    component: () => import('@/views/admin/AuditTrailView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
  {
    path: '/admin/analytics',
    name: 'admin-analytics',
    component: () => import('@/views/admin/PermissionAnalyticsView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Not authenticated, redirect to login
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }

    // Check role requirements
    if (to.meta.requiresRole && Array.isArray(to.meta.requiresRole)) {
      const requiredRoles = to.meta.requiresRole as string[];
      if (!authStore.userRole || !requiredRoles.includes(authStore.userRole)) {
        // Insufficient permissions
        next({ name: 'dashboard' });
        return;
      }
    }
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (to.meta.layout === 'auth' && authStore.isAuthenticated) {
    next({ name: 'dashboard' });
    return;
  }

  next();
});

export default router;
