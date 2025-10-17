<template>
  <div>
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      v-if="type !== 'select' && type !== 'textarea'"
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :pattern="pattern"
      :max="max"
      :min="min"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      :class="{ 'bg-gray-100': disabled }"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    />
    <select
      v-else-if="type === 'select'"
      :id="id"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      :class="{ 'bg-gray-100': disabled }"
      @change="
        $emit('update:modelValue', ($event.target as HTMLSelectElement).value)
      "
    >
      <slot />
    </select>
    <textarea
      v-else
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      :class="{ 'bg-gray-100': disabled }"
      @input="
        $emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)
      "
    />
    <p v-if="hint" class="text-xs text-gray-500 mt-1">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string | number;
  label?: string;
  type?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  pattern?: string;
  hint?: string;
  max?: string;
  min?: string;
  rows?: number;
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  rows: 3,
});

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
