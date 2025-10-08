<template>
  <aside
    :class="[
      'fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40',
      isCollapsed ? 'w-20' : 'w-64',
    ]"
  >
    <!-- Logo & Toggle -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <router-link
        v-if="!isCollapsed"
        to="/dashboard"
        class="flex items-center space-x-3"
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

      <div v-else class="flex justify-center w-full">
        <div
          class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"
        >
          <span class="text-white font-bold text-lg">E</span>
        </div>
      </div>

      <button
        @click="toggleSidebar"
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
      <router-link
        v-for="item in navigationItems"
        :key="item.name"
        :to="item.path"
        v-slot="{ isActive }"
        custom
      >
        <a
          :href="item.path"
          @click.prevent="$router.push(item.path)"
          :class="[
            'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
            isActive
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
            isCollapsed ? 'justify-center' : 'space-x-3',
          ]"
          :title="isCollapsed ? item.label : undefined"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!isCollapsed" class="font-medium">{{ item.label }}</span>
          <span
            v-if="!isCollapsed && item.badge"
            class="ml-auto px-2 py-0.5 text-xs font-semibold bg-danger-100 text-danger-800 rounded-full"
          >
            {{ item.badge }}
          </span>
        </a>
      </router-link>

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
        <router-link
          v-for="item in adminItems"
          :key="item.name"
          :to="item.path"
          v-slot="{ isActive }"
          custom
        >
          <a
            :href="item.path"
            @click.prevent="$router.push(item.path)"
            :class="[
              'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
              isCollapsed ? 'justify-center' : 'space-x-3',
            ]"
            :title="isCollapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!isCollapsed" class="font-medium">{{
              item.label
            }}</span>
          </a>
        </router-link>
      </div>
    </nav>

    <!-- User Menu -->
    <div
      class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white"
    >
      <div
        :class="[
          'flex items-center',
          isCollapsed ? 'justify-center' : 'space-x-3',
        ]"
      >
        <Avatar
          :user="authStore.user"
          size="md"
          color="primary"
          status="online"
        />
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ authStore.userFullName }}
          </p>
          <p class="text-xs text-gray-500 truncate">{{ roleLabel }}</p>
        </div>
        <button
          v-if="!isCollapsed"
          @click="handleLogout"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
          title="Logout"
        >
          <LogoutIcon class="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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
} from '@/components/icons';

const router = useRouter();
const authStore = useAuthStore();

const isCollapsed = ref(false);

const navigationItems = computed(() => [
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

const adminItems = computed(() => [
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

// Use shared user utilities
const { userInitials, roleLabel } = useUserUtils();

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>
