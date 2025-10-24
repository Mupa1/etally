<template>
  <div v-if="hasError" class="error-boundary">
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 mx-4 my-4">
      <div class="flex items-center mb-4">
        <div class="flex-shrink-0">
          <svg
            class="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-red-800">Something went wrong</h3>
        </div>
      </div>

      <div class="text-sm text-red-700 mb-4">
        <p v-if="errorMessage" class="mb-2">{{ errorMessage }}</p>
        <p v-else class="mb-2">
          An unexpected error occurred. Please try refreshing the page.
        </p>

        <details v-if="showDetails" class="mt-4">
          <summary class="cursor-pointer text-red-600 hover:text-red-800">
            Technical Details
          </summary>
          <pre class="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">{{
            errorDetails
          }}</pre>
        </details>
      </div>

      <div class="flex gap-3">
        <button
          @click="retry"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Try Again
        </button>
        <button
          @click="reportError"
          class="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Report Issue
        </button>
        <button
          @click="goHome"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  fallbackMessage?: string;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fallbackMessage: '',
  showDetails: false,
});

const router = useRouter();

const hasError = ref(false);
const errorMessage = ref('');
const errorDetails = ref('');

// Error handling function
function handleError(error: any, errorInfo?: any) {
  hasError.value = true;

  // Determine user-friendly error message
  errorMessage.value = getUserFriendlyMessage(error);

  // Capture technical details for debugging
  errorDetails.value = JSON.stringify(
    {
      error: error?.message || error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
    null,
    2
  );

  // Log error for monitoring
  console.error('Error Boundary caught an error:', error, errorInfo);

  // Send to error reporting service (if available)
  reportErrorToService(error, errorInfo);
}

// Get user-friendly error message based on error type
function getUserFriendlyMessage(error: any): string {
  if (!error) return props.fallbackMessage || 'An unexpected error occurred.';

  const errorMessage = error.message || error.toString();

  // Network errors
  if (
    errorMessage.includes('Network Error') ||
    errorMessage.includes('fetch')
  ) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }

  // Permission errors
  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }

  // Server errors
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('Internal Server Error')
  ) {
    return 'The server is experiencing issues. Please try again later.';
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('required')
  ) {
    return 'Please check your input and try again.';
  }

  // Default fallback
  return (
    props.fallbackMessage || 'An unexpected error occurred. Please try again.'
  );
}

// Retry function
function retry() {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  window.location.reload();
}

// Report error function
function reportError() {
  // In a real application, this would send the error to a reporting service
  const errorReport = {
    message: errorMessage.value,
    details: errorDetails.value,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  console.log('Error Report:', errorReport);

  // You could implement actual error reporting here
  alert('Error has been reported. Thank you for your feedback.');
}

// Go home function
function goHome() {
  router.push('/');
}

// Report error to service (placeholder)
function reportErrorToService(error: any, errorInfo?: any) {
  // In a real application, you would send this to your error reporting service
  // like Sentry, LogRocket, or your own logging service
  console.log('Reporting error to service:', { error, errorInfo });
}

// Capture errors from child components
onErrorCaptured((error, instance, info) => {
  handleError(error, info);
  return false; // Prevent the error from propagating
});

// Handle unhandled promise rejections
onMounted(() => {
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason);
  });

  window.addEventListener('error', (event) => {
    handleError(event.error);
  });
});

// Expose methods for programmatic error handling
defineExpose({
  handleError,
  retry,
  reportError,
});
</script>

<style scoped>
.error-boundary {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
