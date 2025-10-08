<template>
  <div
    v-if="show"
    :class="[
      'p-4 rounded-lg border',
      variantClasses,
      dismissible ? 'pr-12' : '',
    ]"
    role="alert"
  >
    <div class="flex items-start">
      <!-- Icon -->
      <div v-if="showIcon" class="flex-shrink-0">
        <component :is="iconComponent" :class="iconClass" />
      </div>

      <!-- Content -->
      <div :class="showIcon ? 'ml-3' : ''">
        <h3 v-if="title" :class="titleClass">
          {{ title }}
        </h3>
        <div :class="contentClass">
          <slot>{{ message }}</slot>
        </div>
      </div>

      <!-- Dismiss Button -->
      <button
        v-if="dismissible"
        @click="handleDismiss"
        :class="closeButtonClass"
        class="ml-auto -mt-1 -mr-1"
      >
        <span class="sr-only">Dismiss</span>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue';

type Variant = 'success' | 'danger' | 'warning' | 'info';

interface Props {
  variant?: Variant;
  title?: string;
  message?: string;
  show?: boolean;
  dismissible?: boolean;
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  show: true,
  dismissible: false,
  showIcon: true,
});

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();

// Icon components
const SuccessIcon = markRaw({
  template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>
  `,
});

const DangerIcon = markRaw({
  template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
    </svg>
  `,
});

const WarningIcon = markRaw({
  template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `,
});

const InfoIcon = markRaw({
  template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
    </svg>
  `,
});

const variantClasses = computed(() => {
  const variants = {
    success: 'bg-success-50 border-success-200',
    danger: 'bg-danger-50 border-danger-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-primary-50 border-primary-200',
  };
  return variants[props.variant];
});

const iconClass = computed(() => {
  const classes = {
    success: 'text-success-600',
    danger: 'text-danger-600',
    warning: 'text-warning-600',
    info: 'text-primary-600',
  };
  return classes[props.variant];
});

const titleClass = computed(() => {
  const classes = {
    success: 'text-success-900 font-semibold text-sm',
    danger: 'text-danger-900 font-semibold text-sm',
    warning: 'text-warning-900 font-semibold text-sm',
    info: 'text-primary-900 font-semibold text-sm',
  };
  return classes[props.variant];
});

const contentClass = computed(() => {
  const classes = {
    success: 'text-success-800 text-sm',
    danger: 'text-danger-800 text-sm',
    warning: 'text-warning-800 text-sm',
    info: 'text-primary-800 text-sm',
  };
  return props.title
    ? `${classes[props.variant]} mt-1`
    : classes[props.variant];
});

const closeButtonClass = computed(() => {
  const classes = {
    success: 'text-success-600 hover:text-success-800',
    danger: 'text-danger-600 hover:text-danger-800',
    warning: 'text-warning-600 hover:text-warning-800',
    info: 'text-primary-600 hover:text-primary-800',
  };
  return classes[props.variant];
});

const iconComponent = computed(() => {
  const icons = {
    success: SuccessIcon,
    danger: DangerIcon,
    warning: WarningIcon,
    info: InfoIcon,
  };
  return icons[props.variant];
});

function handleDismiss() {
  emit('dismiss');
}
</script>
