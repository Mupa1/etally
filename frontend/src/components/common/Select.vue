<template>
  <Listbox
    as="div"
    :model-value="modelValue"
    @update:model-value="handleChange"
    :disabled="disabled"
  >
    <ListboxLabel v-if="label" class="block text-sm font-medium text-gray-900">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </ListboxLabel>
    <div :class="['relative', label ? 'mt-2' : '']">
      <ListboxButton
        :class="[
          'block w-full cursor-default rounded-lg bg-white text-left text-gray-900',
          'flex items-center justify-between',
          'py-3 sm:py-2.5 pr-3 pl-3',
          'min-h-[48px] sm:min-h-[40px]',
          'border border-gray-300',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'text-base sm:text-sm',
          'transition-colors duration-200',
          'touch-manipulation',
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
        ]"
      >
        <span class="truncate flex-1">
          {{ selectedLabel || placeholder || 'Select an option' }}
        </span>
        <svg
          class="size-5 flex-shrink-0 ml-2 text-gray-500 sm:size-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          />
        </svg>
      </ListboxButton>

      <transition
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-1 outline-black/5 focus:outline-hidden sm:text-sm"
        >
          <ListboxOption
            v-for="option in options"
            v-slot="{ active, selected }"
            :key="option.value"
            :value="option.value"
            as="template"
          >
            <li
              :class="[
                active ? 'bg-primary-600 text-white' : 'text-gray-900',
                'relative cursor-default select-none py-3 sm:py-2 pr-9 pl-3',
                'min-h-[44px] sm:min-h-auto',
                'transition-colors duration-150',
              ]"
            >
              <span
                :class="[
                  selected ? 'font-semibold' : 'font-normal',
                  'block truncate',
                ]"
              >
                {{ option.label }}
              </span>

              <span
                v-if="selected"
                :class="[
                  active ? 'text-white' : 'text-primary-600',
                  'absolute inset-y-0 right-0 flex items-center pr-4',
                ]"
              >
                <svg
                  class="size-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
    <p v-if="helpText" class="mt-1 text-xs text-gray-500">
      {{ helpText }}
    </p>
  </Listbox>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue';

interface SelectOption {
  value: string | number;
  label: string;
}

interface Props {
  modelValue: string | number;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const selectedLabel = computed(() => {
  const option = props.options.find((opt) => opt.value === props.modelValue);
  return option?.label || '';
});

function handleChange(value: string | number) {
  emit('update:modelValue', value);
}
</script>
