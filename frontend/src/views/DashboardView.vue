<template>
  <MainLayout
    page-title="Dashboard"
    page-description="Overview of elections, candidates, and real-time results"
  >
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Elections</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div class="p-3 bg-primary-100 rounded-full">
            <svg
              class="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Candidates</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div class="p-3 bg-success-100 rounded-full">
            <svg
              class="w-8 h-8 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Results Submitted</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div class="p-3 bg-warning-100 rounded-full">
            <svg
              class="w-8 h-8 text-warning-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Polling Stations</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div class="p-3 bg-secondary-100 rounded-full">
            <svg
              class="w-8 h-8 text-secondary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <router-link
          to="/elections/create"
          class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
        >
          <svg
            class="w-6 h-6 text-primary-600 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <div>
            <p class="font-medium text-gray-900">Create Election</p>
            <p class="text-sm text-gray-500">Set up new election</p>
          </div>
        </router-link>

        <router-link
          to="/candidates"
          class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
        >
          <svg
            class="w-6 h-6 text-primary-600 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <div>
            <p class="font-medium text-gray-900">Manage Candidates</p>
            <p class="text-sm text-gray-500">Add or edit candidates</p>
          </div>
        </router-link>

        <router-link
          to="/results/live"
          class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
        >
          <svg
            class="w-6 h-6 text-primary-600 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <div>
            <p class="font-medium text-gray-900">View Live Results</p>
            <p class="text-sm text-gray-500">Real-time election results</p>
          </div>
        </router-link>
      </div>
    </div>

    <!-- System Status -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              class="w-3 h-3 bg-success-500 rounded-full mr-3 animate-pulse"
            ></div>
            <span class="text-sm text-gray-700">Database Connection</span>
          </div>
          <span class="text-sm text-success-600 font-medium">Healthy</span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              class="w-3 h-3 bg-success-500 rounded-full mr-3 animate-pulse"
            ></div>
            <span class="text-sm text-gray-700">API Service</span>
          </div>
          <span class="text-sm text-success-600 font-medium">Running</span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              class="w-3 h-3 bg-success-500 rounded-full mr-3 animate-pulse"
            ></div>
            <span class="text-sm text-gray-700">Cache Service</span>
          </div>
          <span class="text-sm text-success-600 font-medium">Connected</span>
        </div>
        <div
          class="flex items-center justify-between pt-3 border-t border-gray-200"
        >
          <span class="text-xs text-gray-500">Last updated: just now</span>
          <button
            class="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue';
</script>
