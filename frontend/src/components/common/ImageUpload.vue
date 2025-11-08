<template>
  <div class="relative">
    <!-- Image Preview -->
    <div
      v-if="previewUrl || modelValue"
      :class="[
        'rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 relative',
        sizeClasses,
      ]"
    >
      <img
        :src="previewUrl || modelValue"
        :alt="alt"
        :class="['object-cover', sizeClasses]"
        @error="handleImageError"
      />
      <!-- Upload overlay when uploading -->
      <div
        v-if="uploading"
        class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <LoadingSpinner size="md" class="text-white" />
      </div>
    </div>

    <!-- Placeholder (when no image) -->
    <div
      v-else
      :class="[
        'rounded-lg flex items-center justify-center px-3 border-2 border-dashed border-gray-300',
        sizeClasses,
      ]"
    >
      <slot name="placeholder">
        <div class="text-center text-gray-400">
          <svg
            class="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p class="text-sm">No image</p>
        </div>
      </slot>
    </div>

    <!-- Upload Button -->
    <div v-if="!disabled" class="mt-3">
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        class="hidden"
        @change="handleFileSelect"
      />
      <Button
        variant="secondary"
        size="sm"
        @click="fileInput?.click()"
        :loading="uploading"
        :disabled="uploading || disabled"
      >
        <svg
          class="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {{ buttonText }}
      </Button>
      <p v-if="helpText" class="text-xs text-gray-500 mt-1">
        {{ helpText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from './Button.vue';
import LoadingSpinner from './LoadingSpinner.vue';

interface Props {
  modelValue?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  accept?: string;
  maxSizeMB?: number;
  uploading?: boolean;
  disabled?: boolean;
  helpText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Image',
  size: 'md',
  accept: 'image/jpeg,image/jpg,image/png,image/webp',
  maxSizeMB: 5,
  uploading: false,
  disabled: false,
  helpText: 'JPG, PNG or WebP (max 5MB)',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'upload', file: File): void;
  (e: 'error', message: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-32 w-32',
  };
  return sizes[props.size];
});

const buttonText = computed(() => {
  if (props.uploading) return 'Uploading...';
  if (props.modelValue) return 'Change Image';
  return 'Upload Image';
});

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Validate file type
  const allowedTypes = props.accept.split(',');
  if (!allowedTypes.includes(file.type)) {
    emit('error', `Invalid file type. Allowed types: ${props.accept}`);
    return;
  }

  // Validate file size
  const maxSize = props.maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    emit('error', `File size exceeds ${props.maxSizeMB}MB limit.`);
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);

  // Emit upload event
  emit('upload', file);

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function handleImageError() {
  previewUrl.value = null;
  emit('error', 'Failed to load image');
}

// Clear preview when modelValue changes from outside
defineExpose({
  clearPreview: () => {
    previewUrl.value = null;
  },
});
</script>
