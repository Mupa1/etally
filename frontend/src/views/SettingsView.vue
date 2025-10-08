<template>
  <MainLayout
    page-title="Settings"
    page-description="Manage system settings and configurations"
  >
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- General Settings -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          General Settings
        </h3>
        <p class="text-gray-600">System configuration options coming soon...</p>
      </div>

      <!-- User Management -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          User Management
        </h3>
        <p class="text-gray-600">User administration tools coming soon...</p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue';
</script>
