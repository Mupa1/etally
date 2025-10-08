<template>
  <MainLayout
    page-title="My Profile"
    page-description="Manage your account settings and preferences"
  >
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Info -->
      <div class="lg:col-span-2 card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Profile Information
        </h3>
        <p class="text-gray-600">Profile management coming soon...</p>
      </div>

      <!-- Quick Info -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Account Details
        </h3>
        <div class="space-y-3">
          <div>
            <p class="text-xs text-gray-500">Email</p>
            <p class="text-sm font-medium text-gray-900">
              {{ authStore.user?.email }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Role</p>
            <p class="text-sm font-medium text-gray-900">{{ roleLabel }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Status</p>
            <span class="badge-success">Active</span>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import MainLayout from '@/components/layout/MainLayout.vue';

const authStore = useAuthStore();

const roleLabel = computed(() => {
  const role = authStore.userRole;
  if (!role) return 'User';

  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});
</script>
