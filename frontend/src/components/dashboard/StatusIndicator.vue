<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center">
      <div
        :class="[
          'w-3 h-3 rounded-full mr-3',
          statusClass,
          animated ? 'animate-pulse' : '',
        ]"
      ></div>
      <span class="text-sm text-gray-700">{{ label }}</span>
    </div>
    <span :class="['text-sm font-medium', statusTextClass]">
      {{ statusLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Status = 'healthy' | 'unhealthy' | 'warning';

interface Props {
  label: string;
  status: Status;
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  animated: true,
});

const statusClass = computed(() => {
  const classes = {
    healthy: 'bg-success-500',
    unhealthy: 'bg-danger-500',
    warning: 'bg-warning-500',
  };
  return classes[props.status];
});

const statusTextClass = computed(() => {
  const classes = {
    healthy: 'text-success-600',
    unhealthy: 'text-danger-600',
    warning: 'text-warning-600',
  };
  return classes[props.status];
});

const statusLabel = computed(() => {
  const labels = {
    healthy: 'Healthy',
    unhealthy: 'Down',
    warning: 'Warning',
  };
  return labels[props.status];
});
</script>
