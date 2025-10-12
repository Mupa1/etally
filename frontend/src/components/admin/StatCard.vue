<template>
  <div class="bg-white shadow-sm rounded-lg p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        <p class="text-3xl font-bold mt-2" :class="colorClass">
          {{ value }}
        </p>
        <p v-if="percentage !== undefined" class="text-sm text-gray-500 mt-1">
          {{ percentage.toFixed(1) }}% of total
        </p>
      </div>
      <div class="p-3 rounded-full" :class="bgColorClass">
        <svg
          class="w-6 h-6"
          :class="colorClass"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            :d="iconPaths"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  value: string | number;
  percentage?: number;
  icon: 'check' | 'check-circle' | 'x-circle' | 'clock';
  color?: 'primary' | 'success' | 'danger' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
});

const colorClass = computed(() => {
  const colors = {
    primary: 'text-primary-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
  };
  return colors[props.color];
});

const bgColorClass = computed(() => {
  const colors = {
    primary: 'bg-primary-100',
    success: 'bg-green-100',
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
  };
  return colors[props.color];
});

const iconPaths = computed(() => {
  const paths = {
    check: 'M5 13l4 4L19 7',
    'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    'x-circle':
      'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  return paths[props.icon];
});
</script>
