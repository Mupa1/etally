<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <!-- Search Icon -->
      <div
        class="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"
      >
        <svg
          class="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <!-- Input Field - Mobile Optimized -->
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="placeholder"
        :class="[
          'block w-full',
          // Mobile: Larger text and padding for better UX
          'text-base sm:text-sm',
          'pl-10 sm:pl-11 pr-10 sm:pr-11',
          'py-3 sm:py-2.5',
          'min-h-[48px] sm:min-h-[40px]',
          // Styling
          'border border-gray-300 rounded-lg',
          'placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-colors duration-200',
          // Mobile optimizations
          'touch-manipulation',
        ]"
        @input="handleInput"
        @keyup.enter="handleEnter"
      />

      <!-- Clear Button - Mobile Friendly -->
      <button
        v-if="searchQuery"
        @click="clear"
        class="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center touch-manipulation"
        type="button"
        aria-label="Clear search"
      >
        <svg
          class="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
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

    <!-- Search Suggestions/Results (Optional) -->
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
    >
      <button
        v-for="(suggestion, index) in suggestions"
        :key="index"
        @click="selectSuggestion(suggestion)"
        class="w-full px-4 py-3 sm:py-2.5 text-left hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px] sm:min-h-auto"
      >
        <slot name="suggestion" :suggestion="suggestion">
          {{ suggestion }}
        </slot>
      </button>
    </div>

    <!-- Loading Indicator -->
    <div
      v-if="loading"
      class="absolute right-12 sm:right-12 top-1/2 -translate-y-1/2"
    >
      <LoadingSpinner size="sm" class="text-primary-600" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDebouncedFunction } from '@/composables/useDebounce';
import LoadingSpinner from './LoadingSpinner.vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
  debounce?: number;
  loading?: boolean;
  suggestions?: any[];
  showSuggestions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search...',
  debounce: 300,
  loading: false,
  suggestions: () => [],
  showSuggestions: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
  (e: 'select', value: any): void;
  (e: 'clear'): void;
}>();

const searchQuery = ref(props.modelValue);

// Watch for external updates
watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue;
  }
);

// Debounced search emit
const debouncedSearch = useDebouncedFunction((value: string) => {
  emit('search', value);
}, props.debounce);

function handleInput() {
  emit('update:modelValue', searchQuery.value);
  debouncedSearch(searchQuery.value);
}

function handleEnter() {
  emit('search', searchQuery.value);
}

function clear() {
  searchQuery.value = '';
  emit('update:modelValue', '');
  emit('search', '');
  emit('clear');
}

function selectSuggestion(suggestion: any) {
  emit('select', suggestion);
}
</script>
