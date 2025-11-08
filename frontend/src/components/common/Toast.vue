<template>
  <TransitionGroup
    name="toast"
    tag="div"
    class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="[
        'pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg max-w-md min-w-[300px] animate-slide-in-right',
        variantClasses[toast.variant],
      ]"
    >
      <!-- Icon -->
      <div :class="['flex-shrink-0', iconClasses[toast.variant]]">
        <component :is="iconComponents[toast.variant]" class="w-5 h-5" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p v-if="toast.title" class="font-semibold text-sm mb-1">
          {{ toast.title }}
        </p>
        <p :class="['text-sm', toast.title ? '' : 'font-medium']">
          {{ toast.message }}
        </p>
      </div>

      <!-- Close Button -->
      <button
        @click="removeToast(toast.id)"
        :class="[
          'flex-shrink-0 -mr-1 -mt-1 p-1 rounded hover:bg-black/10 transition-colors',
          closeButtonClasses[toast.variant],
        ]"
        aria-label="Close"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue';
import { useToastStore } from '@/composables/useToast';

const toastStore = useToastStore();

// Access the reactive toasts ref directly
const toasts = computed(() => toastStore.toasts.value);

const variantClasses = {
  success: 'bg-green-50 border border-green-200 text-green-800',
  error: 'bg-red-50 border border-red-200 text-red-800',
  warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border border-blue-200 text-blue-800',
};

const iconClasses = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

const closeButtonClasses = {
  success: 'text-green-600 hover:text-green-800',
  error: 'text-red-600 hover:text-red-800',
  warning: 'text-yellow-600 hover:text-yellow-800',
  info: 'text-blue-600 hover:text-blue-800',
};

const SuccessIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
  `,
});

const ErrorIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `,
});

const WarningIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `,
});

const InfoIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `,
});

const iconComponents = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

function removeToast(id: string) {
  toastStore.remove(id);
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease;
}
</style>

