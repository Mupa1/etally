<template>
  <div class="basic-info-step">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
    <p class="text-gray-600 mb-6">
      Provide the essential details for this election.
    </p>

    <div class="space-y-6">
      <!-- Election Code -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Election Code <span class="text-red-500">*</span>
        </label>
        <input
          :value="electionCode"
          @input="$emit('update:electionCode', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="e.g., GE-2027, BE-KITUI-WEST-2024"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          :class="{ 'border-red-500': errors.electionCode }"
          required
        />
        <p class="text-xs text-gray-500 mt-1">
          Unique identifier (uppercase letters, numbers, hyphens, underscores)
        </p>
        <p v-if="errors.electionCode" class="text-xs text-red-500 mt-1">
          {{ errors.electionCode }}
        </p>
      </div>

      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Election Title <span class="text-red-500">*</span>
        </label>
        <input
          :value="title"
          @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
          type="text"
          :placeholder="getTitlePlaceholder()"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          :class="{ 'border-red-500': errors.title }"
          required
        />
        <p v-if="errors.title" class="text-xs text-red-500 mt-1">
          {{ errors.title }}
        </p>
      </div>

      <!-- Election Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Election Date <span class="text-red-500">*</span>
        </label>
        <input
          :value="electionDate ? formatDateForInput(electionDate) : ''"
          @input="handleDateInput($event)"
          type="date"
          :min="getMinDate()"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          :class="{ 'border-red-500': errors.electionDate }"
          required
        />
        <p class="text-xs text-gray-500 mt-1">
          Must be in the future
        </p>
        <p v-if="errors.electionDate" class="text-xs text-red-500 mt-1">
          {{ errors.electionDate }}
        </p>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          :value="description"
          @input="$emit('update:description', ($event.target as HTMLTextAreaElement).value)"
          rows="4"
          placeholder="Provide additional context or background information about this election..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          maxlength="1000"
        ></textarea>
        <p class="text-xs text-gray-500 mt-1">
          {{ (description || '').length }}/1000 characters
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  electionCode: string;
  title: string;
  electionDate: Date | null;
  description?: string;
  electionType: string | null;
}

interface Emits {
  (e: 'update:electionCode', value: string): void;
  (e: 'update:title', value: string): void;
  (e: 'update:electionDate', value: Date | null): void;
  (e: 'update:description', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const errors = ref({
  electionCode: '',
  title: '',
  electionDate: '',
});

function getTitlePlaceholder(): string {
  switch (props.electionType) {
    case 'general_election':
      return 'e.g., 2027 General Election';
    case 'by_election':
      return 'e.g., Kitui West By-Election 2024';
    case 'referendum':
      return 'e.g., Constitutional Amendment Referendum 2025';
    default:
      return 'Enter election title';
  }
}

function getMinDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1); // Must be after today
  return date.toISOString().split('T')[0];
}

function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return '';
}

function handleDateInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.value) {
    const date = new Date(target.value);
    emit('update:electionDate', date);
  } else {
    emit('update:electionDate', null);
  }
}

// Validation
watch(
  () => props.electionCode,
  (value) => {
    if (value && !/^[A-Z0-9_-]+$/.test(value)) {
      errors.value.electionCode = 'Only uppercase letters, numbers, hyphens, and underscores allowed';
    } else if (value && (value.length < 3 || value.length > 50)) {
      errors.value.electionCode = 'Must be between 3 and 50 characters';
    } else {
      errors.value.electionCode = '';
    }
  }
);

watch(
  () => props.title,
  (value) => {
    if (value && (value.length < 5 || value.length > 200)) {
      errors.value.title = 'Must be between 5 and 200 characters';
    } else {
      errors.value.title = '';
    }
  }
);

watch(
  () => props.electionDate,
  (value) => {
    if (value && new Date(value) <= new Date()) {
      errors.value.electionDate = 'Election date must be in the future';
    } else {
      errors.value.electionDate = '';
    }
  }
);
</script>

