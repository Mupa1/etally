<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Photo Preview (if file selected) -->
    <div v-if="file && preview" class="mb-4">
      <div class="relative inline-block">
        <img
          :src="preview"
          alt="Preview"
          class="w-48 h-48 object-cover rounded-lg border-2 border-gray-300"
        />
        <button
          type="button"
          @click="removePhoto"
          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
      </div>
      <p class="text-sm text-gray-600 mt-2">{{ file.name }}</p>
    </div>

    <!-- Upload Options (if no file selected) -->
    <div v-if="!file" class="space-y-3">
      <!-- Take Photo Button -->
      <button
        v-if="allowCamera"
        type="button"
        @click="triggerCamera"
        class="w-full border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-100 transition-colors"
      >
        <div class="flex flex-col items-center">
          <svg
            class="h-12 w-12 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p class="mt-2 text-sm font-medium text-blue-700">📸 Take a Selfie</p>
          <p class="text-xs text-blue-600">Use your camera</p>
        </div>
      </button>

      <!-- Upload from Gallery Button -->
      <button
        type="button"
        @click="triggerFileInput"
        class="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-gray-50 transition-colors"
      >
        <div class="flex flex-col items-center">
          <svg
            class="h-12 w-12 text-gray-400"
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
          <p class="mt-2 text-sm font-medium text-gray-700">{{ uploadText }}</p>
          <p v-if="hint" class="text-xs text-gray-500">{{ hint }}</p>
        </div>
      </button>
    </div>

    <!-- Hidden file inputs -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="handleFileChange"
    />
    <input
      ref="cameraInputRef"
      type="file"
      :accept="accept"
      capture="user"
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: File | null;
  label?: string;
  required?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  uploadText?: string;
  hint?: string;
  allowCamera?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  maxSize: 5 * 1024 * 1024, // 5MB default
  uploadText: '📁 Upload from Gallery',
  hint: 'PNG, JPG up to 5MB',
  allowCamera: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | null): void;
  (e: 'error', message: string): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const cameraInputRef = ref<HTMLInputElement | null>(null);
const file = ref<File | null>(props.modelValue);
const preview = ref<string | null>(null);

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    file.value = newValue;
    if (newValue) {
      generatePreview(newValue);
    } else {
      preview.value = null;
    }
  }
);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function triggerCamera() {
  cameraInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const selectedFile = target.files?.[0];

  if (!selectedFile) return;

  // Validate file size
  if (selectedFile.size > props.maxSize) {
    emit(
      'error',
      `File size must be less than ${props.maxSize / (1024 * 1024)}MB`
    );
    return;
  }

  // Validate file type if accept is specified
  if (
    props.accept &&
    !selectedFile.type.match(props.accept.replace('*', '.*'))
  ) {
    emit('error', 'Invalid file type');
    return;
  }

  file.value = selectedFile;
  emit('update:modelValue', selectedFile);
  generatePreview(selectedFile);
}

function generatePreview(selectedFile: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.value = e.target?.result as string;
  };
  reader.readAsDataURL(selectedFile);
}

function removePhoto() {
  file.value = null;
  preview.value = null;
  emit('update:modelValue', null);

  // Reset file inputs
  if (fileInputRef.value) fileInputRef.value.value = '';
  if (cameraInputRef.value) cameraInputRef.value.value = '';
}
</script>
