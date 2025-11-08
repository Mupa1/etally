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
  icon:
    | 'check'
    | 'check-circle'
    | 'x-circle'
    | 'clock'
    | 'map'
    | 'location'
    | 'building'
    | 'users';
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
    map: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    location:
      'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    building:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    users:
      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  };
  return paths[props.icon];
});
</script>
