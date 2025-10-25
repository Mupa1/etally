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
  {
    path: '/settings/voting-areas',
    name: 'settings-voting-areas',
    component: () => import('@/views/settings/VotingAreasView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin', 'election_manager'],
    },
  },
  {
    path: '/settings/configurations',
    name: 'settings-configurations',
    component: () => import('@/views/settings/ConfigurationsView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
  {
    path: '/settings/configurations/:id',
    name: 'settings-configuration-detail',
    component: () => import('@/views/settings/ConfigurationDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
  // Admin Routes
  {
    path: '/admin/parties',
    name: 'admin-parties',
    component: () => import('@/views/admin/PartyManagementView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin', 'election_manager'],
    },
  },
  {
    path: '/admin/parties/:id',
    name: 'admin-party-detail',
    component: () => import('@/views/admin/PartyDetailView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin', 'election_manager'],
    },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UsersOverviewView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
  {
    path: '/admin/observers',
    name: 'admin-observers',
    component: () => import('@/views/admin/ObserversView.vue'),
    meta: {
      requiresAuth: true,
      requiresRole: ['super_admin'],
    },
  },
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
  // Agent/Observer Routes
  {
    path: '/agent',
    name: 'agent-landing',
    component: () => import('@/views/mobile/AgentLandingView.vue'),
    meta: { requiresAuth: false, layout: 'mobile' },
  },
  {
    path: '/agent/register',
    name: 'observer-register',
    component: () => import('@/views/mobile/ObserverRegisterView.vue'),
    meta: { requiresAuth: false, layout: 'mobile' },
  },
  {
    path: '/agent/success/:trackingNumber',
    name: 'observer-registration-success',
    component: () =>
      import('@/views/mobile/ObserverRegistrationSuccessView.vue'),
    meta: { requiresAuth: false, layout: 'mobile' },
  },
  {
    path: '/agent/track/:trackingNumber?',
    name: 'observer-tracking',
    component: () => import('@/views/mobile/ObserverTrackingView.vue'),
    meta: { requiresAuth: false, layout: 'mobile' },
  },
  {
    path: '/agent/setup-password',
    name: 'observer-password-setup',
    component: () => import('@/views/mobile/PasswordSetupView.vue'),
    meta: { requiresAuth: false, layout: 'mobile' },
  },
  {
    path: '/agent/login',
    name: 'observer-login',
    component: () => import('@/views/mobile/ObserverLoginView.vue'),
    meta: { requiresAuth: false, layout: 'mobile' },
  },
  {
    path: '/agent/dashboard',
    name: 'observer-dashboard',
    component: () => import('@/views/mobile/ObserverDashboardView.vue'),
    meta: { requiresAuth: true, requiresRole: ['field_observer'] },
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
