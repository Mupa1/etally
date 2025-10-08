/**
 * User Utilities Composable
 * Shared logic for user display and formatting
 */

import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/auth';

export function useUserUtils() {
  const authStore = useAuthStore();

  /**
   * Get user initials (e.g., "John Doe" → "JD")
   */
  const userInitials = computed(() => {
    if (!authStore.user) return '?';
    const first = authStore.user.firstName?.[0] || '';
    const last = authStore.user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  });

  /**
   * Get initials from any user object
   */
  function getUserInitials(user: User | null | undefined): string {
    if (!user) return '?';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  }

  /**
   * Format role for display (e.g., "super_admin" → "Super Admin")
   */
  const roleLabel = computed(() => {
    const role = authStore.userRole;
    if (!role) return 'User';

    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  /**
   * Format any role string for display
   */
  function formatRole(role: string | undefined | null): string {
    if (!role) return 'User';

    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get full name of current user
   */
  const userFullName = computed(() => {
    return authStore.userFullName;
  });

  /**
   * Get full name from any user object
   */
  function getUserFullName(user: User | null | undefined): string {
    if (!user) return 'Unknown User';
    return `${user.firstName} ${user.lastName}`;
  }

  return {
    // Computed values (for current user)
    userInitials,
    roleLabel,
    userFullName,

    // Utility functions (for any user)
    getUserInitials,
    formatRole,
    getUserFullName,
  };
}
