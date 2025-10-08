/**
 * Sorting Composable
 * Manages table sorting state and operations
 */

import { ref, computed } from 'vue';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

export function useSort(
  defaultColumn: string | null = null,
  defaultDirection: SortDirection = 'asc'
) {
  const sortColumn = ref<string | null>(defaultColumn);
  const sortDirection = ref<SortDirection>(
    defaultColumn ? defaultDirection : null
  );

  const sortState = computed<SortState>(() => ({
    column: sortColumn.value,
    direction: sortDirection.value,
  }));

  function toggleSort(column: string) {
    if (sortColumn.value === column) {
      // Same column: cycle through asc -> desc -> null
      if (sortDirection.value === 'asc') {
        sortDirection.value = 'desc';
      } else if (sortDirection.value === 'desc') {
        sortDirection.value = null;
        sortColumn.value = null;
      }
    } else {
      // New column: start with asc
      sortColumn.value = column;
      sortDirection.value = 'asc';
    }
  }

  function setSort(column: string, direction: SortDirection) {
    sortColumn.value = column;
    sortDirection.value = direction;
  }

  function clearSort() {
    sortColumn.value = null;
    sortDirection.value = null;
  }

  function getSortIcon(column: string): string {
    if (sortColumn.value !== column) return 'unsorted';
    if (sortDirection.value === 'asc') return 'asc';
    if (sortDirection.value === 'desc') return 'desc';
    return 'unsorted';
  }

  function sortData<T>(data: T[], accessor?: (item: T) => any): T[] {
    if (!sortColumn.value || !sortDirection.value) return data;

    return [...data].sort((a, b) => {
      const aValue = accessor ? accessor(a) : (a as any)[sortColumn.value!];
      const bValue = accessor ? accessor(b) : (b as any)[sortColumn.value!];

      // Handle null/undefined
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection.value === 'asc' ? comparison : -comparison;
    });
  }

  return {
    // State
    sortColumn,
    sortDirection,
    sortState,

    // Actions
    toggleSort,
    setSort,
    clearSort,
    getSortIcon,
    sortData,
  };
}
