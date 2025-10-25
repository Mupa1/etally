<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            Communication
          </h1>
          <p class="text-sm sm:text-base text-gray-600 mt-1">
            Manage system notifications, messages, and communications
          </p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Email Service"
          :value="emailStatus"
          icon="users"
          color="success"
        />
        <StatCard
          title="Pending Messages"
          value="0"
          icon="clock"
          color="warning"
        />
        <StatCard
          title="Sent Today"
          value="0"
          icon="check-circle"
          color="success"
        />
        <StatCard
          title="Total Recipients"
          value="0"
          icon="users"
          color="primary"
        />
      </div>

      <!-- Email Configuration Status -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Email Service Status</h2>
          <Badge :variant="emailStatus === 'Active' ? 'success' : 'danger'" size="sm">
            {{ emailStatus }}
          </Badge>
        </div>
        <p class="text-sm text-gray-600">
          SMTP configuration is managed in System Configurations. Check the 
          <router-link to="/settings/configurations/email" class="text-primary-600 hover:text-primary-700 underline">
            Email Service Settings
          </router-link>
          to view or update configuration.
        </p>
      </div>

      <!-- Placeholder for future features -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Communication Features</h2>
        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <svg class="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="font-medium text-gray-900">Email Notifications</h3>
              <p class="text-sm text-gray-500">Send automated emails for observer registrations, approvals, and system events</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <div>
              <h3 class="font-medium text-gray-900">In-App Notifications</h3>
              <p class="text-sm text-gray-500">Coming soon - Real-time notifications for users</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="font-medium text-gray-900">SMS Integration</h3>
              <p class="text-sm text-gray-500">Coming soon - SMS notifications for critical alerts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import StatCard from '@/components/admin/StatCard.vue';
import Badge from '@/components/common/Badge.vue';

const loading = ref(false);
const error = ref<string | null>(null);
const emailStatus = ref('Active');

// Future: Add API calls to check email service status, pending messages, etc.

onMounted(async () => {
  // Future: Load communication statistics
});
</script>
