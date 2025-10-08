<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div
      :class="[
        'flex flex-col min-h-screen transition-all duration-300',
        // Mobile: No margin (sidebar is overlay)
        // Desktop: Margin based on collapsed state
        'ml-0 sm:ml-20 lg:ml-64',
      ]"
    >
      <!-- Top Header Bar -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div class="px-4 sm:px-6 py-4">
          <div class="flex items-center justify-between">
            <!-- Mobile: Hamburger Menu + Page Title -->
            <div class="flex items-center space-x-3 flex-1">
              <!-- Hamburger Menu Button (Mobile Only) -->
              <button
                @click="toggleMobileMenu"
                class="sm:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
                aria-label="Open menu"
              >
                <MenuIcon class="text-gray-600" />
              </button>

              <!-- Page Title -->
              <div class="flex-1">
                <h1
                  v-if="pageTitle"
                  class="text-xl sm:text-2xl font-bold text-gray-900"
                >
                  {{ pageTitle }}
                </h1>
                <p
                  v-if="pageDescription"
                  class="text-xs sm:text-sm text-gray-600 mt-1"
                >
                  {{ pageDescription }}
                </p>
              </div>
            </div>

            <!-- Header Actions -->
            <div class="flex items-center space-x-4">
              <!-- Notifications -->
              <button
                class="relative p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
                aria-label="Notifications"
              >
                <BellIcon class="w-6 h-6" />
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
                <Avatar :user="authStore.user" size="md" color="primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content - Grows to fill available space -->
      <main class="flex-1 p-4 sm:p-6">
        <slot />
      </main>

      <!-- Footer - Pinned to bottom -->
      <footer
        class="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white mt-auto"
      >
        <div
          class="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-600 space-y-2 sm:space-y-0"
        >
          <p class="text-center sm:text-left">
            © 2025 Kenya Election Management System
          </p>
          <div class="flex items-center space-x-3 sm:space-x-4">
            <a href="#" class="hover:text-primary-600 transition-colors"
              >Help</a
            >
            <a
              href="#"
              class="hover:text-primary-600 transition-colors hidden sm:inline"
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
import { provide, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUserUtils } from '@/composables/useUserUtils';
import Avatar from '@/components/common/Avatar.vue';
import { BellIcon, MenuIcon } from '@/components/icons';
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
const isMobileMenuOpen = ref(false);

// Use shared user utilities
const { userInitials, roleLabel } = useUserUtils();

// Toggle mobile menu
function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;

  // Prevent body scroll when mobile menu is open
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = '';
}

// Provide sidebar state for child components
provide('isSidebarCollapsed', isSidebarCollapsed);
provide('isMobileMenuOpen', isMobileMenuOpen);
provide('closeMobileMenu', closeMobileMenu);
</script>
