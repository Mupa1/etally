<template>
  <div class="card">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">{{ label }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">
          {{ formattedValue }}
        </p>
        <p v-if="change" :class="changeClass" class="text-sm mt-1">
          {{ change }}
        </p>
      </div>
      <div :class="iconBackgroundClass" class="p-3 rounded-full">
        <component :is="iconComponent" :class="iconColorClass" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  ElectionsIcon,
  CandidatesIcon,
  ResultsIcon,
  LocationIcon,
} from '@/components/icons';

type IconType = 'elections' | 'candidates' | 'results' | 'location';
type ColorVariant = 'primary' | 'success' | 'warning' | 'secondary';

interface Props {
  label: string;
  value: number | string;
  icon: IconType;
  color?: ColorVariant;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  changeType: 'neutral',
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }
  return props.value;
});

const iconComponent = computed(() => {
  const icons = {
    elections: ElectionsIcon,
    candidates: CandidatesIcon,
    results: ResultsIcon,
    location: LocationIcon,
  };
  return icons[props.icon];
});

const iconBackgroundClass = computed(() => {
  const backgrounds = {
    primary: 'bg-primary-100',
    success: 'bg-success-100',
    warning: 'bg-warning-100',
    secondary: 'bg-secondary-100',
  };
  return backgrounds[props.color];
});

const iconColorClass = computed(() => {
  const colors = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    secondary: 'text-secondary-600',
  };
  return `w-8 h-8 ${colors[props.color]}`;
});

const changeClass = computed(() => {
  const classes = {
    positive: 'text-success-600',
    negative: 'text-danger-600',
    neutral: 'text-gray-600',
  };
  return classes[props.changeType];
});
</script>
