<template>
  <!-- Mobile Backdrop Overlay -->
  <Transition name="fade">
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 sm:hidden"
      @click="closeMobileMenu"
    ></div>
  </Transition>

  <aside
    :class="[
      'fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300',
      // Mobile: Hidden by default (-translate-x-full), full width when open
      'w-64 sm:w-20 lg:w-64',
      '-translate-x-full sm:translate-x-0',
      // Mobile menu open: slide in and higher z-index
      isMobileMenuOpen ? 'translate-x-0 z-50' : 'z-40',
      // Desktop/Tablet: Respect collapsed state
      { 'sm:w-20': isCollapsed, 'sm:w-64': !isCollapsed },
    ]"
  >
    <!-- Logo & Toggle -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <!-- Mobile & Expanded Desktop: Full Logo -->
      <router-link
        v-if="isMobileMenuOpen || !isCollapsed"
        to="/dashboard"
        class="flex items-center space-x-3"
        @click.prevent="handleNavClick('/dashboard')"
      >
        <div
          class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"
        >
          <span class="text-white font-bold text-lg">E</span>
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900">eTally</h1>
          <p class="text-xs text-gray-500">Elections Portal</p>
        </div>
      </router-link>

      <!-- Desktop Collapsed: Icon Only -->
      <div v-else class="flex justify-center w-full">
        <div
          class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"
        >
          <span class="text-white font-bold text-lg">E</span>
        </div>
      </div>

      <!-- Mobile: Close button -->
      <button
        v-if="isMobileMenuOpen"
        @click="closeMobileMenu"
        class="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Close menu"
      >
        <CloseIcon class="text-gray-600" />
      </button>

      <!-- Desktop: Toggle collapse button -->
      <button
        @click="toggleSidebar"
        class="hidden sm:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
        :class="{ 'ml-auto': !isCollapsed }"
      >
        <ChevronIcon
          class="w-5 h-5 text-gray-600 transition-transform"
          :class="{ 'rotate-180': isCollapsed }"
        />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
      <template v-for="item in navigationItems" :key="item.name">
        <router-link :to="item.path" v-slot="{ isActive }" custom>
          <a
            :href="item.path"
            @click.prevent="handleNavClick(item.path)"
            :class="[
              'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 touch-manipulation min-h-[44px]',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
              isCollapsed ? 'justify-center' : 'space-x-3',
            ]"
            :title="isCollapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!isCollapsed || isMobileMenuOpen" class="font-medium">{{
              item.label
            }}</span>
            <span
              v-if="(!isCollapsed || isMobileMenuOpen) && item.badge"
              class="ml-auto px-2 py-0.5 text-xs font-semibold bg-danger-100 text-danger-800 rounded-full"
            >
              {{ item.badge }}
            </span>
          </a>
        </router-link>
      </template>

      <!-- Divider -->
      <div class="py-2">
        <div class="border-t border-gray-200"></div>
      </div>

      <!-- Admin Section (Only for admins) -->
      <div v-if="authStore.isElectionManager">
        <p
          v-if="!isCollapsed"
          class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
        >
          Administration
        </p>
        <template v-for="item in adminItems" :key="item.name">
          <router-link :to="item.path" v-slot="{ isActive }" custom>
            <a
              :href="item.path"
              @click.prevent="handleNavClick(item.path)"
              :class="[
                'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 touch-manipulation min-h-[44px]',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                isCollapsed ? 'justify-center' : 'space-x-3',
              ]"
              :title="isCollapsed ? item.label : undefined"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span
                v-if="!isCollapsed || isMobileMenuOpen"
                class="font-medium"
                >{{ item.label }}</span
              >
            </a>
          </router-link>
        </template>
      </div>
    </nav>

    <!-- User Menu -->
    <div
      class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white"
    >
      <div
        :class="[
          'flex items-center',
          isCollapsed && !isMobileMenuOpen ? 'justify-center' : 'space-x-3',
        ]"
      >
        <Avatar
          :user="authStore.user"
          size="md"
          color="primary"
          status="online"
        />
        <div v-if="!isCollapsed || isMobileMenuOpen" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ authStore.userFullName }}
          </p>
          <p class="text-xs text-gray-500 truncate">{{ roleLabel }}</p>
        </div>
        <button
          v-if="!isCollapsed || isMobileMenuOpen"
          @click="handleLogout"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
          title="Logout"
          aria-label="Logout"
        >
          <LogoutIcon class="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
// @ts-nocheck - False positive errors with Vue template types and router-link v-slot
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  inject,
  type Ref,
  type Component,
} from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUserUtils } from '@/composables/useUserUtils';
import Avatar from '@/components/common/Avatar.vue';
import {
  DashboardIcon,
  ElectionsIcon,
  CandidatesIcon,
  ResultsIcon,
  LiveIcon,
  SettingsIcon,
  UsersIcon,
  ChevronIcon,
  LogoutIcon,
  CloseIcon,
} from '@/components/icons';

// Navigation item type
interface NavigationItem {
  name: string;
  label: string;
  path: string;
  icon: Component;
  badge?: string;
}

const router = useRouter();
const authStore = useAuthStore();
const { userInitials, roleLabel } = useUserUtils();

const isCollapsed = ref(false);
const isMobile = ref(false);

// Inject mobile menu state from MainLayout (with proper types)
const isMobileMenuOpen = inject('isMobileMenuOpen', ref(false)) as Ref<boolean>;
const closeMobileMenu = inject('closeMobileMenu', () => {}) as () => void;

// Detect mobile viewport
function checkMobile() {
  isMobile.value = window.innerWidth < 640; // sm breakpoint
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const navigationItems = computed<NavigationItem[]>(() => [
  {
    name: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
  },
  {
    name: 'elections',
    label: 'Elections',
    path: '/elections',
    icon: ElectionsIcon,
  },
  {
    name: 'candidates',
    label: 'Candidates',
    path: '/candidates',
    icon: CandidatesIcon,
  },
  {
    name: 'results',
    label: 'Results',
    path: '/results',
    icon: ResultsIcon,
  },
  {
    name: 'live-results',
    label: 'Live Results',
    path: '/results/live',
    icon: LiveIcon,
    badge: 'LIVE',
  },
]);

const adminItems = computed<NavigationItem[]>(() => [
  {
    name: 'users',
    label: 'Users',
    path: '/settings',
    icon: UsersIcon,
  },
  {
    name: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: SettingsIcon,
  },
]);

function toggleSidebar() {
  // Desktop only: toggle collapse
  if (!isMobile.value) {
    isCollapsed.value = !isCollapsed.value;
  }
}

function handleNavClick(path: string) {
  router.push(path);
  // Close mobile menu after navigation
  if (isMobileMenuOpen.value) {
    closeMobileMenu();
  }
}

async function handleLogout() {
  await authStore.logout();
  closeMobileMenu();
  router.push('/login');
}
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
