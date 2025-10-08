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
        <svg
          class="w-5 h-5 text-gray-600 transition-transform"
          :class="{ 'rotate-180': isCollapsed }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
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
        <div
          class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <span class="text-primary-700 font-semibold text-sm">
            {{ userInitials }}
          </span>
        </div>
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ authStore.userFullName }}
          </p>
          <p class="text-xs text-gray-500 truncate">{{ roleLabel }}</p>
        </div>
        <button
          v-if="!isCollapsed"
          @click="handleLogout"
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Logout"
        >
          <svg
            class="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Icons as inline SVG components
const DashboardIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`,
};

const ElectionsIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>`,
};

const CandidatesIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`,
};

const ResultsIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`,
};

const LiveIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`,
};

const SettingsIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
};

const UsersIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
};

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

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>
