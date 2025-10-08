<template>
  <div
    :class="[
      'flex flex-col sm:flex-row items-center justify-between',
      'px-4 py-3 sm:px-6',
      'bg-white border-t border-gray-200',
      'space-y-3 sm:space-y-0',
    ]"
  >
    <!-- Results Info - Mobile: Full width, larger text -->
    <div class="flex-1 flex justify-center sm:justify-start">
      <p class="text-sm sm:text-xs text-gray-700">
        Showing
        <span class="font-medium">{{ startItem }}</span>
        to
        <span class="font-medium">{{ endItem }}</span>
        of
        <span class="font-medium">{{ totalItems }}</span>
        results
      </p>
    </div>

    <!-- Pagination Controls - Mobile Optimized -->
    <div class="flex items-center space-x-2">
      <!-- Previous Button - Mobile: Larger -->
      <button
        @click="goToPrevious"
        :disabled="!hasPrevious"
        :class="[
          'inline-flex items-center',
          'px-3 py-2 sm:px-2 sm:py-1.5',
          'min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]',
          'border border-gray-300 rounded-lg',
          'text-sm font-medium',
          'transition-colors touch-manipulation',
          hasPrevious
            ? 'text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100'
            : 'text-gray-400 bg-gray-50 cursor-not-allowed',
        ]"
        aria-label="Previous page"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <!-- Page Numbers - Desktop only, simplified on mobile -->
      <div class="hidden sm:flex items-center space-x-1">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="typeof page === 'number'"
            @click="goToPage(page)"
            :class="[
              'px-3 py-1.5 min-w-[36px] min-h-[36px]',
              'border rounded-lg text-sm font-medium',
              'transition-colors touch-manipulation',
              page === currentPage
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100',
            ]"
          >
            {{ page }}
          </button>
          <span v-else class="px-2 text-gray-400">...</span>
        </template>
      </div>

      <!-- Mobile: Current Page Indicator -->
      <div class="flex sm:hidden items-center px-4 py-2 min-h-[44px]">
        <span class="text-sm font-medium text-gray-700">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
      </div>

      <!-- Next Button - Mobile: Larger -->
      <button
        @click="goToNext"
        :disabled="!hasNext"
        :class="[
          'inline-flex items-center',
          'px-3 py-2 sm:px-2 sm:py-1.5',
          'min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]',
          'border border-gray-300 rounded-lg',
          'text-sm font-medium',
          'transition-colors touch-manipulation',
          hasNext
            ? 'text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100'
            : 'text-gray-400 bg-gray-50 cursor-not-allowed',
        ]"
        aria-label="Next page"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>

    <!-- Per Page Selector - Mobile: Bottom, larger text -->
    <div
      v-if="showPerPage"
      class="flex items-center justify-center sm:justify-end"
    >
      <label for="per-page" class="mr-2 text-sm text-gray-700"> Show: </label>
      <select
        id="per-page"
        v-model="selectedPerPage"
        @change="handlePerPageChange"
        :class="[
          'border border-gray-300 rounded-lg',
          'text-sm font-medium text-gray-700',
          'px-3 py-2 sm:px-2 sm:py-1.5',
          'min-h-[44px] sm:min-h-[36px]',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          'touch-manipulation',
        ]"
      >
        <option v-for="option in perPageOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Button from './Button.vue';

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage?: number;
  showPerPage?: boolean;
  perPageOptions?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  perPage: 10,
  showPerPage: true,
  perPageOptions: () => [10, 25, 50, 100],
});

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'per-page-change', perPage: number): void;
}>();

const selectedPerPage = ref(props.perPage);

watch(
  () => props.perPage,
  (newValue) => {
    selectedPerPage.value = newValue;
  }
);

const hasPrevious = computed(() => props.currentPage > 1);
const hasNext = computed(() => props.currentPage < props.totalPages);

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.currentPage - 1) * props.perPage + 1;
});

const endItem = computed(() => {
  return Math.min(props.currentPage * props.perPage, props.totalItems);
});

// Calculate visible page numbers with ellipsis
const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const total = props.totalPages;
  const current = props.currentPage;

  if (total <= 7) {
    // Show all pages if 7 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    // Show pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    // Always show last page
    pages.push(total);
  }

  return pages;
});

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page);
  }
}

function goToPrevious() {
  if (hasPrevious.value) {
    emit('page-change', props.currentPage - 1);
  }
}

function goToNext() {
  if (hasNext.value) {
    emit('page-change', props.currentPage + 1);
  }
}

function handlePerPageChange() {
  emit('per-page-change', selectedPerPage.value);
}
</script>
