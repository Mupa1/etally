<template>
  <span :class="badgeClasses">
    <!-- Dot Indicator -->
    <span
      v-if="dot"
      :class="[
        'w-2 h-2 rounded-full mr-1.5',
        dotColorClass,
        animated ? 'animate-pulse' : '',
      ]"
    ></span>

    <!-- Content -->
    <slot>{{ label }}</slot>

    <!-- Close Button (mobile-friendly) -->
    <button
      v-if="closeable"
      @click="handleClose"
      class="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors touch-manipulation min-w-[24px] min-h-[24px] flex items-center justify-center"
      type="button"
      aria-label="Remove"
    >
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Variant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'gray';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  variant?: Variant;
  size?: Size;
  label?: string;
  dot?: boolean;
  animated?: boolean;
  closeable?: boolean;
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  dot: false,
  animated: false,
  closeable: false,
  rounded: true,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const badgeClasses = computed(() => {
  const classes = [
    'inline-flex items-center font-medium',

    // Size classes (mobile-optimized for readability)
    sizeClass.value,

    // Variant classes
    variantClass.value,

    // Shape
    props.rounded ? 'rounded-full' : 'rounded-md',
  ];

  return classes.join(' ');
});

const sizeClass = computed(() => {
  const sizes = {
    // Mobile: slightly larger for better readability
    sm: 'text-xs px-2 py-0.5 min-h-[20px]',
    md: 'text-sm px-2.5 py-0.5 min-h-[24px]',
    lg: 'text-base px-3 py-1 min-h-[28px]',
  };
  return sizes[props.size];
});

const variantClass = computed(() => {
  const variants = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    success: 'bg-success-100 text-success-800',
    danger: 'bg-danger-100 text-danger-800',
    warning: 'bg-warning-100 text-warning-800',
    info: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
  };
  return variants[props.variant];
});

const dotColorClass = computed(() => {
  const colors = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    danger: 'bg-danger-600',
    warning: 'bg-warning-600',
    info: 'bg-blue-600',
    gray: 'bg-gray-600',
  };
  return colors[props.variant];
});

function handleClose() {
  emit('close');
}
</script>
