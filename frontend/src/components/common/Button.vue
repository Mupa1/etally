<template>
  <component
    :is="tag"
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <LoadingSpinner v-if="loading" :size="spinnerSize" class="mr-2" />

    <!-- Leading Icon -->
    <component
      v-if="leadingIcon && !loading"
      :is="leadingIcon"
      :class="iconSize"
    />

    <!-- Button Content -->
    <span
      v-if="$slots.default || label"
      :class="{ 'mx-2': leadingIcon || trailingIcon }"
    >
      <slot>{{ label }}</slot>
    </span>

    <!-- Trailing Icon -->
    <component v-if="trailingIcon" :is="trailingIcon" :class="iconSize" />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';
import type { Component } from 'vue';

type Variant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'ghost'
  | 'link';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  variant?: Variant;
  size?: Size;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
  label?: string;
  leadingIcon?: Component;
  trailingIcon?: Component;
  href?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
  rounded: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const tag = computed(() => (props.href ? 'a' : 'button'));

const buttonClasses = computed(() => {
  const classes = [
    // Base styles
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',

    // Mobile: Larger touch targets
    'touch-manipulation',

    // Size classes (mobile-optimized)
    sizeClasses.value,

    // Variant classes
    variantClasses.value,

    // Width
    props.fullWidth ? 'w-full' : '',

    // Rounded
    props.rounded ? 'rounded-full' : 'rounded-lg',
  ];

  return classes.filter(Boolean).join(' ');
});

const sizeClasses = computed(() => {
  const sizes = {
    // Mobile-first: Minimum 44px height (Apple HIG touch target)
    xs: 'text-xs px-2.5 py-1.5 min-h-[36px] sm:min-h-[32px]',
    sm: 'text-sm px-3 py-2 min-h-[44px] sm:min-h-[36px]',
    md: 'text-sm px-4 py-2.5 min-h-[48px] sm:min-h-[40px]',
    lg: 'text-base px-5 py-3 min-h-[52px] sm:min-h-[44px]',
    xl: 'text-lg px-6 py-3.5 min-h-[56px] sm:min-h-[48px]',
  };
  return sizes[props.size];
});

const variantClasses = computed(() => {
  const variants = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500 shadow-sm',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 focus:ring-gray-500 shadow-sm',
    success:
      'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus:ring-success-500 shadow-sm',
    danger:
      'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 focus:ring-danger-500 shadow-sm',
    warning:
      'bg-warning-600 text-white hover:bg-warning-700 active:bg-warning-800 focus:ring-warning-500 shadow-sm',
    ghost:
      'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-500',
    link: 'bg-transparent text-primary-600 hover:text-primary-700 hover:underline focus:ring-0 shadow-none',
  };
  return variants[props.variant];
});

const iconSize = computed(() => {
  const sizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };
  return sizes[props.size];
});

const spinnerSize = computed(() => {
  const sizes = {
    xs: 'sm' as const,
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'md' as const,
    xl: 'lg' as const,
  };
  return sizes[props.size];
});

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>
