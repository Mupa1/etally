<template>
  <div class="autocomplete-field" ref="fieldRef">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <input
        :id="id"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-label="label || placeholder"
        :aria-describedby="hint ? `${id}-hint` : undefined"
        :aria-invalid="hasError"
        :aria-required="required"
        :aria-expanded="showSuggestions"
        :aria-activedescendant="activeSuggestionId"
        role="combobox"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        :class="{
          'bg-gray-100': disabled,
          'border-red-500': hasError,
          'rounded-b-none': showSuggestions,
        }"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <!-- Suggestions dropdown -->
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="absolute z-50 w-full bg-white border border-gray-300 border-t-0 rounded-b-md shadow-lg max-h-60 overflow-y-auto"
        role="listbox"
      >
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          :id="`${id}-suggestion-${index}`"
          class="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
          :class="{ 'bg-blue-50': index === activeSuggestionIndex }"
          role="option"
          :aria-selected="index === activeSuggestionIndex"
          @click="selectSuggestion(suggestion)"
          @mousedown.prevent
        >
          <div class="flex items-center">
            <span class="flex-1">{{ getSuggestionText(suggestion) }}</span>
            <span
              v-if="getSuggestionSubtext(suggestion)"
              class="text-sm text-gray-500 ml-2"
            >
              {{ getSuggestionSubtext(suggestion) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div
        v-if="loading"
        class="absolute right-3 top-1/2 transform -translate-y-1/2"
      >
        <div
          class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"
        ></div>
      </div>
    </div>

    <p
      v-if="hint"
      :id="`${id}-hint`"
      class="text-xs text-gray-500 mt-1"
      role="note"
    >
      {{ hint }}
    </p>

    <p v-if="hasError" class="text-xs text-red-600 mt-1" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { formAutoCompletion } from '@/utils/progressiveFormSaving';

interface Props {
  modelValue: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  errorMessage?: string;
  autocomplete?: string;
  suggestions?: any[];
  loading?: boolean;
  maxSuggestions?: number;
  minQueryLength?: number;
  debounceDelay?: number;
  fieldName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  maxSuggestions: 5,
  minQueryLength: 2,
  debounceDelay: 300,
  fieldName: 'default',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'suggestion-selected', suggestion: any): void;
  (e: 'query-changed', query: string): void;
}>();

const fieldRef = ref<HTMLElement>();
const inputRef = ref<HTMLInputElement>();
const showSuggestions = ref(false);
const activeSuggestionIndex = ref(-1);
const suggestions = ref<any[]>([]);
const query = ref('');
const debounceTimer = ref<NodeJS.Timeout | null>(null);

// Generate unique ID
const id = computed(
  () => `autocomplete-${Math.random().toString(36).substr(2, 9)}`
);

// Active suggestion ID for accessibility
const activeSuggestionId = computed(() =>
  activeSuggestionIndex.value >= 0
    ? `${id.value}-suggestion-${activeSuggestionIndex.value}`
    : undefined
);

// Check if field has error
const hasError = computed(() => !!props.errorMessage);

// Handle input changes
const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const value = target.value;

  emit('update:modelValue', value);
  query.value = value;

  // Debounce the query change
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }

  debounceTimer.value = setTimeout(() => {
    emit('query-changed', value);
    updateSuggestions(value);
  }, props.debounceDelay);
};

// Update suggestions based on query
const updateSuggestions = async (query: string): Promise<void> => {
  if (query.length < props.minQueryLength) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }

  // Use form auto-completion if no suggestions provided
  if (!props.suggestions) {
    const autoSuggestions = formAutoCompletion.getSuggestions(
      props.fieldName,
      query,
      props.maxSuggestions
    );
    suggestions.value = autoSuggestions;
  } else {
    // Filter provided suggestions
    const filtered = props.suggestions
      .filter((suggestion) =>
        getSuggestionText(suggestion)
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .slice(0, props.maxSuggestions);

    suggestions.value = filtered;
  }

  showSuggestions.value = suggestions.value.length > 0;
  activeSuggestionIndex.value = -1;
};

// Handle focus
const handleFocus = (): void => {
  if (query.value.length >= props.minQueryLength) {
    showSuggestions.value = suggestions.value.length > 0;
  }
};

// Handle blur
const handleBlur = (): void => {
  // Delay hiding suggestions to allow click events
  setTimeout(() => {
    showSuggestions.value = false;
    activeSuggestionIndex.value = -1;
  }, 200);
};

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent): void => {
  if (!showSuggestions.value || suggestions.value.length === 0) {
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      activeSuggestionIndex.value = Math.min(
        activeSuggestionIndex.value + 1,
        suggestions.value.length - 1
      );
      break;

    case 'ArrowUp':
      event.preventDefault();
      activeSuggestionIndex.value = Math.max(
        activeSuggestionIndex.value - 1,
        -1
      );
      break;

    case 'Enter':
      event.preventDefault();
      if (activeSuggestionIndex.value >= 0) {
        selectSuggestion(suggestions.value[activeSuggestionIndex.value]);
      }
      break;

    case 'Escape':
      showSuggestions.value = false;
      activeSuggestionIndex.value = -1;
      break;
  }
};

// Select a suggestion
const selectSuggestion = (suggestion: any): void => {
  const text = getSuggestionText(suggestion);
  emit('update:modelValue', text);
  emit('suggestion-selected', suggestion);

  // Add to auto-completion data
  formAutoCompletion.addCompletionEntry(props.fieldName, text);

  showSuggestions.value = false;
  activeSuggestionIndex.value = -1;

  // Focus back to input
  nextTick(() => {
    inputRef.value?.focus();
  });
};

// Get suggestion text
const getSuggestionText = (suggestion: any): string => {
  if (typeof suggestion === 'string') {
    return suggestion;
  }
  return suggestion.text || suggestion.label || suggestion.toString();
};

// Get suggestion subtext
const getSuggestionSubtext = (suggestion: any): string => {
  if (typeof suggestion === 'object' && suggestion.subtext) {
    return suggestion.subtext;
  }
  return '';
};

// Clean up on unmount
onUnmounted(() => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }
});

// Watch for external suggestion changes
watch(
  () => props.suggestions,
  (newSuggestions) => {
    if (newSuggestions && query.value.length >= props.minQueryLength) {
      suggestions.value = newSuggestions.slice(0, props.maxSuggestions);
      showSuggestions.value = suggestions.value.length > 0;
    }
  }
);
</script>

<style scoped>
.autocomplete-field {
  position: relative;
}

/* Custom scrollbar for suggestions */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Mobile touch improvements */
@media (max-width: 768px) {
  .autocomplete-field input {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  .autocomplete-field .absolute {
    max-height: 200px;
  }
}
</style>
