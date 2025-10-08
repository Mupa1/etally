<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div
      :class="[
        'transition-all duration-300',
        isSidebarCollapsed ? 'ml-20' : 'ml-64',
      ]"
    >
      <!-- Top Header Bar -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div class="px-6 py-4">
          <div class="flex items-center justify-between">
            <!-- Breadcrumbs or Page Title -->
            <div>
              <h1 v-if="pageTitle" class="text-2xl font-bold text-gray-900">
                {{ pageTitle }}
              </h1>
              <p v-if="pageDescription" class="text-sm text-gray-600 mt-1">
                {{ pageDescription }}
              </p>
            </div>

            <!-- Header Actions -->
            <div class="flex items-center space-x-4">
              <!-- Notifications -->
              <button
                class="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span
                  class="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"
                ></span>
              </button>

              <!-- User Info -->
              <div class="flex items-center space-x-3">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-medium text-gray-900">
                    {{ authStore.userFullName }}
                  </p>
                  <p class="text-xs text-gray-500">{{ roleLabel }}</p>
                </div>
                <div
                  class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center"
                >
                  <span class="text-primary-700 font-semibold text-sm">
                    {{ userInitials }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="px-6 py-4 border-t border-gray-200 bg-white">
        <div class="flex items-center justify-between text-sm text-gray-600">
          <p>© 2025 Kenya Election Management System. All rights reserved.</p>
          <div class="flex items-center space-x-4">
            <a href="#" class="hover:text-primary-600 transition-colors"
              >Help</a
            >
            <a href="#" class="hover:text-primary-600 transition-colors"
              >Documentation</a
            >
            <a href="#" class="hover:text-primary-600 transition-colors"
              >Support</a
            >
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Sidebar from './Sidebar.vue';

// Props
interface Props {
  pageTitle?: string;
  pageDescription?: string;
}

const props = withDefaults(defineProps<Props>(), {
  pageTitle: '',
  pageDescription: '',
});

const authStore = useAuthStore();
const isSidebarCollapsed = ref(false);

// Provide sidebar state for child components
provide('isSidebarCollapsed', isSidebarCollapsed);

const userInitials = computed(() => {
  if (!authStore.user) return '?';
  const first = authStore.user.firstName?.[0] || '';
  const last = authStore.user.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
});

const roleLabel = computed(() => {
  const role = authStore.userRole;
  if (!role) return 'User';

  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});
</script>
