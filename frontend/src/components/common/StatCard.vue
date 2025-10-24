<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ formattedValue }}
        </p>
        <p v-if="trend" class="text-sm mt-1" :class="trendClass">
          {{ trendText }}
        </p>
      </div>
      <div
        v-if="$slots.icon || icon"
        class="p-3 rounded-lg"
        :class="iconBgClass"
      >
        <slot name="icon">
          <component v-if="icon" :is="icon" :class="iconClass" />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

type ColorVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  title: string;
  value: number | string;
  icon?: Component;
  color?: ColorVariant;
  trend?: number; // Percentage change, e.g., 12.5 for +12.5%
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  loading: false,
});

const formattedValue = computed(() => {
  if (props.loading) return '...';
  return typeof props.value === 'number'
    ? props.value.toLocaleString()
    : props.value;
});

const iconBgClass = computed(() => {
  const colors = {
    primary: 'bg-primary-50',
    success: 'bg-success-50',
    warning: 'bg-warning-50',
    danger: 'bg-danger-50',
    info: 'bg-blue-50',
  };
  return colors[props.color];
});

const iconClass = computed(() => {
  const colors = {
    primary: 'w-6 h-6 text-primary-600',
    success: 'w-6 h-6 text-success-600',
    warning: 'w-6 h-6 text-warning-600',
    danger: 'w-6 h-6 text-danger-600',
    info: 'w-6 h-6 text-blue-600',
  };
  return colors[props.color];
});

const trendClass = computed(() => {
  if (!props.trend) return '';
  return props.trend > 0
    ? 'text-success-600'
    : props.trend < 0
      ? 'text-danger-600'
      : 'text-gray-600';
});

const trendText = computed(() => {
  if (!props.trend) return '';
  const prefix = props.trend > 0 ? '+' : '';
  return `${prefix}${props.trend}%`;
});
</script>
