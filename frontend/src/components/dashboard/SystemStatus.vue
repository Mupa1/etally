<template>
  <div class="card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
    <div class="space-y-3">
      <StatusIndicator
        v-for="service in services"
        :key="service.name"
        :label="service.label"
        :status="service.status"
      />

      <div
        class="flex items-center justify-between pt-3 border-t border-gray-200"
      >
        <span class="text-xs text-gray-500">{{ lastUpdated }}</span>
        <button
          @click="$emit('refresh')"
          class="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatusIndicator from './StatusIndicator.vue';

interface Service {
  name: string;
  label: string;
  status: 'healthy' | 'unhealthy' | 'warning';
}

interface Props {
  services: Service[];
  lastUpdated?: string;
}

const props = withDefaults(defineProps<Props>(), {
  lastUpdated: 'just now',
});

defineEmits<{
  (e: 'refresh'): void;
}>();
</script>
