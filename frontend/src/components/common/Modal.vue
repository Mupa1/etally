<template>
  <!-- Modal Backdrop -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="handleBackdropClick"
      >
        <!-- Backdrop Overlay -->
        <div
          class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
          aria-hidden="true"
        ></div>

        <!-- Modal Container - Mobile Optimized -->
        <div
          class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <!-- Modal Content -->
          <Transition name="modal-slide">
            <div
              v-if="modelValue"
              :class="[
                'relative w-full bg-white shadow-xl transition-all',
                // Mobile: Full screen bottom sheet
                'rounded-t-2xl sm:rounded-lg',
                'max-h-[90vh] sm:max-h-[85vh]',
                // Desktop: Centered modal with max width
                sizeClass,
              ]"
              @click.stop
              role="dialog"
              aria-modal="true"
            >
              <!-- Close Button (Mobile: Top-right, always visible) -->
              <button
                v-if="closeable"
                @click="close"
                class="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="Close"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <!-- Mobile: Drag Handle -->
              <div class="sm:hidden flex justify-center pt-3 pb-2">
                <div class="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              <!-- Modal Header -->
              <div
                v-if="$slots.header || title"
                class="px-4 sm:px-6 py-4 border-b border-gray-200"
              >
                <slot name="header">
                  <h3
                    class="text-lg sm:text-xl font-semibold text-gray-900 pr-8"
                  >
                    {{ title }}
                  </h3>
                  <p v-if="description" class="mt-1 text-sm text-gray-600">
                    {{ description }}
                  </p>
                </slot>
              </div>

              <!-- Modal Body (Scrollable) -->
              <div
                :class="[
                  'px-4 sm:px-6 py-4 overflow-y-auto',
                  hasFooter ? '' : 'pb-6',
                ]"
                :style="{ maxHeight: bodyMaxHeight }"
              >
                <slot />
              </div>

              <!-- Modal Footer -->
              <div
                v-if="$slots.footer || hasFooter"
                class="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50"
              >
                <slot name="footer">
                  <div
                    class="flex flex-col-reverse sm:flex-row sm:justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3"
                  >
                    <button
                      v-if="showCancel"
                      @click="cancel"
                      class="w-full sm:w-auto btn-secondary touch-manipulation min-h-[44px] sm:min-h-[40px]"
                    >
                      {{ cancelLabel }}
                    </button>
                    <button
                      v-if="showConfirm"
                      @click="confirm"
                      :disabled="confirmDisabled"
                      :class="[
                        'w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-[40px]',
                        confirmVariant === 'danger'
                          ? 'btn-danger'
                          : 'btn-primary',
                      ]"
                    >
                      {{ confirmLabel }}
                    </button>
                  </div>
                </slot>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface Props {
  modelValue: boolean;
  title?: string;
  description?: string;
  size?: Size;
  closeable?: boolean;
  closeOnBackdrop?: boolean;
  showCancel?: boolean;
  showConfirm?: boolean;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmVariant?: 'primary' | 'danger';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeable: true,
  closeOnBackdrop: true,
  showCancel: false,
  showConfirm: false,
  cancelLabel: 'Cancel',
  confirmLabel: 'Confirm',
  confirmDisabled: false,
  confirmVariant: 'primary',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
  (e: 'cancel'): void;
  (e: 'confirm'): void;
}>();

const sizeClass = computed(() => {
  const sizes = {
    // Mobile: Full width, Desktop: Max width
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    full: 'sm:max-w-full sm:mx-4',
  };
  return sizes[props.size];
});

const hasFooter = computed(() => {
  return props.showCancel || props.showConfirm;
});

const bodyMaxHeight = computed(() => {
  // Mobile: Account for header, footer, and safe areas
  if (hasFooter.value) {
    return 'calc(90vh - 200px)';
  }
  return 'calc(90vh - 120px)';
});

function close() {
  if (props.closeable) {
    emit('update:modelValue', false);
    emit('close');
  }
}

function cancel() {
  emit('cancel');
  close();
}

function confirm() {
  emit('confirm');
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    close();
  }
}

// Lock body scroll when modal is open (important for mobile)
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevent iOS scroll bounce
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }
);

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
});

// ESC key to close
function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue && props.closeable) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
});
</script>

<style scoped>
/* Modal Fade Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Modal Slide Transition - Mobile: Slide up, Desktop: Scale */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.3s ease;
}

/* Mobile: Slide up from bottom */
.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Desktop: Scale and fade */
@media (min-width: 640px) {
  .modal-slide-enter-from,
  .modal-slide-leave-to {
    transform: translateY(0) scale(0.95);
    opacity: 0;
  }
}
</style>
