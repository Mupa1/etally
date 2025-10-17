<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Header -->
    <MobileHeader
      title="Field Observer Portal"
      :subtitle="userName"
      @logout="handleLogout"
    />

    <!-- Content -->
    <div class="p-4">
      <!-- Welcome Card -->
      <FormCard title="Welcome to the Observer Portal" class="mb-4">
        <p class="text-gray-600 text-sm">Phase 1 Registration Complete! 🎉</p>
        <p class="text-gray-600 text-sm mt-2">
          Result submission features will be available in Phase 3 (Week 3).
        </p>
      </FormCard>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Assigned Stations</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ assignedStations }}
          </p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Results Submitted</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ resultsSubmitted }}
          </p>
        </div>
      </div>

      <!-- Coming Soon Section -->
      <Alert variant="warning" title="Coming in Phase 3:" class="p-6">
        <ul class="space-y-2 text-sm mt-2">
          <li class="flex items-center gap-2">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            View assigned polling stations
          </li>
          <li class="flex items-center gap-2">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Submit election results offline
          </li>
          <li class="flex items-center gap-2">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Upload Form 34A photos
          </li>
          <li class="flex items-center gap-2">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Auto-sync when online
          </li>
        </ul>
      </Alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Alert from '@/components/common/Alert.vue';
import MobileHeader from '@/components/mobile/MobileHeader.vue';
import FormCard from '@/components/mobile/FormCard.vue';

const router = useRouter();
const authStore = useAuthStore();

const assignedStations = ref(0);
const resultsSubmitted = ref(0);

const userName = computed(() => {
  const user = authStore.user;
  return user ? `${user.firstName} ${user.lastName}` : 'Observer';
});

onMounted(() => {
  // TODO: Load observer data in Phase 2
  assignedStations.value = 0;
  resultsSubmitted.value = 0;
});

function handleLogout() {
  authStore.logout();
  router.push('/mobile/login');
}
</script>
