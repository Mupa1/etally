<template>
  <div class="relative inline-flex items-center justify-center">
    <svg
      class="transform -rotate-90"
      :width="size"
      :height="size"
    >
      <!-- Background circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        stroke="currentColor"
        class="text-gray-200"
        fill="none"
      />
      <!-- Progress circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        stroke="currentColor"
        :class="progressColor"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
    <!-- Percentage text -->
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <span class="text-2xl font-bold" :class="textColor">
        {{ Math.round(percentage) }}%
      </span>
      <span v-if="label" class="text-xs text-gray-500 mt-1">
        {{ label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  percentage: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  strokeWidth: 8,
  percentage: 0,
});

const center = computed(() => props.size / 2);
const radius = computed(() => props.size / 2 - props.strokeWidth);
const circumference = computed(() => 2 * Math.PI * radius.value);
const offset = computed(() => {
  const progress = Math.min(Math.max(props.percentage, 0), 100);
  return circumference.value - (progress / 100) * circumference.value;
});

const progressColor = computed(() => {
  if (props.percentage >= 90) return 'text-success-600';
  if (props.percentage >= 75) return 'text-primary-600';
  if (props.percentage >= 50) return 'text-warning-600';
  return 'text-danger-600';
});

const textColor = computed(() => {
  if (props.percentage >= 90) return 'text-success-700';
  if (props.percentage >= 75) return 'text-primary-700';
  if (props.percentage >= 50) return 'text-warning-700';
  return 'text-danger-700';
});
</script>

