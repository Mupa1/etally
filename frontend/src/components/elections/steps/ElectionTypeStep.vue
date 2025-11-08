<template>
  <div class="election-type-step">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Select Election Type</h2>
    <p class="text-gray-600 mb-6">
      Choose the type of election you want to create. Each type has different requirements and workflows.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- General Election -->
      <div
        class="border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg"
        :class="
          modelValue === 'general_election'
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        "
        @click="$emit('update:modelValue', 'general_election')"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">
              General Election
            </h3>
            <p class="text-sm text-gray-600">
              Nationwide election for multiple positions simultaneously
            </p>
          </div>
          <div
            class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            :class="
              modelValue === 'general_election'
                ? 'border-blue-600 bg-blue-600'
                : 'border-gray-300'
            "
          >
            <svg
              v-if="modelValue === 'general_election'"
              class="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <div class="space-y-2 text-sm text-gray-500">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            National coverage
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Multiple positions
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            High complexity
          </div>
        </div>
      </div>

      <!-- By-Election -->
      <div
        class="border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg"
        :class="
          modelValue === 'by_election'
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        "
        @click="$emit('update:modelValue', 'by_election')"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">By-Election</h3>
            <p class="text-sm text-gray-600">
              Election to fill a single vacant position
            </p>
          </div>
          <div
            class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            :class="
              modelValue === 'by_election'
                ? 'border-blue-600 bg-blue-600'
                : 'border-gray-300'
            "
          >
            <svg
              v-if="modelValue === 'by_election'"
              class="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <div class="space-y-2 text-sm text-gray-500">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Localized scope
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Single position
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Low-medium complexity
          </div>
        </div>
      </div>

      <!-- Referendum -->
      <div
        class="border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg"
        :class="
          modelValue === 'referendum'
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        "
        @click="$emit('update:modelValue', 'referendum')"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">Referendum</h3>
            <p class="text-sm text-gray-600">
              Direct vote on a specific question or proposal
            </p>
          </div>
          <div
            class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            :class="
              modelValue === 'referendum'
                ? 'border-blue-600 bg-blue-600'
                : 'border-gray-300'
            "
          >
            <svg
              v-if="modelValue === 'referendum'"
              class="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <div class="space-y-2 text-sm text-gray-500">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            National coverage
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Yes/No voting
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Medium complexity
          </div>
        </div>
      </div>

      <!-- Re-Run Election (Future) -->
      <div
        class="border-2 rounded-lg p-6 cursor-pointer transition-all opacity-60"
        :class="
          modelValue === 're_run_election'
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-300'
        "
        @click="$emit('update:modelValue', 're_run_election')"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">Re-Run Election</h3>
            <p class="text-sm text-gray-600">
              Redo of a nullified election
            </p>
            <span class="text-xs text-orange-600 font-medium mt-1 inline-block">
              Coming Soon
            </span>
          </div>
          <div
            class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            :class="
              modelValue === 're_run_election'
                ? 'border-blue-600 bg-blue-600'
                : 'border-gray-300'
            "
          >
            <svg
              v-if="modelValue === 're_run_election'"
              class="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <div class="space-y-2 text-sm text-gray-500">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Links to parent election
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Same structure as original
          </div>
        </div>
      </div>
    </div>

    <!-- Parent Election Selection (for Re-Run) -->
    <div v-if="modelValue === 're_run_election'" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p class="text-sm text-yellow-800 mb-3">
        Re-run elections are not yet implemented. This feature will be available in a future update.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string | null;
  parentElectionId?: string | null;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'update:parentElectionId', value: string | null): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

