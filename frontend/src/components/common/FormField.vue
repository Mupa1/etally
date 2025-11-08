<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Text Input -->
    <input
      v-if="isEditMode && type === 'text'"
      :value="modelValue"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      :type="inputType"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="isEditMode && type === 'textarea'"
      :value="modelValue"
      @input="
        $emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)
      "
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    />

    <!-- Select -->
    <select
      v-else-if="isEditMode && type === 'select'"
      :value="modelValue || ''"
      @change="handleSelectChange"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    >
      <slot name="options" />
    </select>

    <!-- View Mode -->
    <div v-else>
      <slot name="view" :value="modelValue">
        <p :class="['text-gray-900', valueClass]">
          {{ displayValue }}
        </p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  modelValue?: any;
  isEditMode: boolean;
  type?: 'text' | 'textarea' | 'select';
  inputType?: 'text' | 'email' | 'number' | 'url' | 'tel';
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  emptyText?: string;
  valueClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  inputType: 'text',
  rows: 3,
  required: false,
  disabled: false,
  readonly: false,
  emptyText: '—',
  valueClass: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const displayValue = computed(() => {
  if (
    props.modelValue === null ||
    props.modelValue === undefined ||
    props.modelValue === ''
  ) {
    return props.emptyText;
  }
  return props.modelValue;
});

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const value = target.value;

  // Emit null for empty string (from "Not Set" option)
  emit('update:modelValue', value === '' ? null : value);
}
</script>
