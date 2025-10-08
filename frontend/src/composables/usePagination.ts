/**
 * Pagination Composable
 * Manages pagination state and calculations
 */

import { ref, computed } from 'vue';

export interface PaginationState {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export function usePagination(initialPerPage: number = 10) {
  const currentPage = ref(1);
  const perPage = ref(initialPerPage);
  const totalItems = ref(0);

  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / perPage.value);
  });

  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value;
  });

  const hasPreviousPage = computed(() => {
    return currentPage.value > 1;
  });

  const startIndex = computed(() => {
    return (currentPage.value - 1) * perPage.value;
  });

  const endIndex = computed(() => {
    return Math.min(startIndex.value + perPage.value, totalItems.value);
  });

  const displayRange = computed(() => {
    if (totalItems.value === 0) return '0-0 of 0';
    return `${startIndex.value + 1}-${endIndex.value} of ${totalItems.value}`;
  });

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  }

  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++;
    }
  }

  function previousPage() {
    if (hasPreviousPage.value) {
      currentPage.value--;
    }
  }

  function setPerPage(count: number) {
    perPage.value = count;
    currentPage.value = 1; // Reset to first page
  }

  function setTotalItems(count: number) {
    totalItems.value = count;
  }

  function reset() {
    currentPage.value = 1;
    totalItems.value = 0;
  }

  return {
    // State
    currentPage,
    perPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    displayRange,

    // Actions
    goToPage,
    nextPage,
    previousPage,
    setPerPage,
    setTotalItems,
    reset,
  };
}
