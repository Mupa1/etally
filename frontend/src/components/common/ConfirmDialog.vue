<template>
  <Modal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :size="size"
    :closeable="closeable"
    :closeOnBackdrop="closeOnBackdrop"
    :showCancel="true"
    :showConfirm="true"
    :cancelLabel="cancelLabel"
    :confirmLabel="confirmLabel"
    :confirmDisabled="confirmDisabled"
    :confirmVariant="variant"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @close="handleCancel"
  >
    <template #header>
      <div class="flex items-start gap-4">
        <!-- Icon -->
        <div
          :class="[
            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
            iconClasses[variant],
          ]"
        >
          <component :is="iconComponents[variant]" class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900">
            {{ title }}
          </h3>
          <p v-if="description" class="mt-1 text-sm text-gray-600">
            {{ description }}
          </p>
        </div>
      </div>
    </template>

    <!-- Body Content -->
    <div class="py-2">
      <p v-if="message" class="text-sm text-gray-700">
        {{ message }}
      </p>
      <slot>
        <!-- Additional content can be inserted here -->
      </slot>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { markRaw } from 'vue';
import Modal from './Modal.vue';

export type ConfirmVariant = 'primary' | 'danger' | 'warning' | 'info';

interface Props {
  modelValue: boolean;
  title: string;
  message?: string;
  description?: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeable?: boolean;
  closeOnBackdrop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmDisabled: false,
  size: 'md',
  closeable: true,
  closeOnBackdrop: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

// Icon components
const PrimaryIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `,
});

const DangerIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
  primary: PrimaryIcon,
  danger: DangerIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

const iconClasses = {
  primary: 'bg-blue-100 text-blue-600',
  danger: 'bg-red-100 text-red-600',
  warning: 'bg-yellow-100 text-yellow-600',
  info: 'bg-blue-100 text-blue-600',
};

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
  emit('update:modelValue', false);
}
</script>

