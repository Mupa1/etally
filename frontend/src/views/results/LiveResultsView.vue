<template>
  <MainLayout
    page-title="Live Results"
    page-description="Real-time election results dashboard"
  >
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <div
            class="w-3 h-3 bg-danger-500 rounded-full mr-2 animate-pulse"
          ></div>
          <span class="text-sm font-medium text-gray-900">LIVE</span>
        </div>
        <span class="text-sm text-gray-500">Updated just now</span>
      </div>
      <p class="text-gray-600">
        Live results dashboard will be displayed here...
      </p>
      <p class="text-sm text-gray-500 mt-2">
        Real-time updates with Chart.js visualizations!
      </p>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue';
</script>
