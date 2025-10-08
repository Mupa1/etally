/**
 * Debounce Composable
 * Delays execution of a function until after a specified delay
 * Perfect for search inputs to avoid excessive API calls
 */

import { ref, watch } from 'vue';

export function useDebounce<T>(value: T, delay: number = 300) {
  const debouncedValue = ref<T>(value);
  let timeoutId: NodeJS.Timeout | null = null;

  watch(
    () => value,
    (newValue) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        debouncedValue.value = newValue as T;
      }, delay);
    }
  );

  return debouncedValue;
}

/**
 * Debounce function (for callbacks)
 */
export function useDebouncedFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
