<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="bg-white shadow-lg rounded-lg p-8 text-center">
        <!-- Success Icon -->
        <div class="mb-6">
          <div
            class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-10 h-10 text-green-600"
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

        <!-- Success Message -->
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
          Application Submitted Successfully!
        </h1>

        <p class="text-gray-600 mb-6">
          Your agent registration has been received and is now under review.
        </p>

        <!-- Tracking Number -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-gray-700 mb-2">
            Your Application Tracking Number:
          </p>
          <p class="text-2xl font-mono font-bold text-blue-600">
            {{ trackingNumber }}
          </p>
          <button
            @click="copyTrackingNumber"
            class="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {{ copied ? '✓ Copied!' : 'Copy to clipboard' }}
          </button>
        </div>

        <!-- Next Steps -->
        <div class="text-left mb-6">
          <h3 class="font-semibold text-gray-900 mb-3">What happens next:</h3>
          <ol class="space-y-3 text-sm text-gray-700">
            <li class="flex items-start">
              <span
                class="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0"
                >1</span
              >
              <span
                >Our team will review your application (typically within 24-48
                hours)</span
              >
            </li>
            <li class="flex items-start">
              <span
                class="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0"
                >2</span
              >
              <span
                >You will receive an SMS notification about your application
                status</span
              >
            </li>
            <li class="flex items-start">
              <span
                class="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0"
                >3</span
              >
              <span
                >If approved, you'll get a password setup link to activate your
                account</span
              >
            </li>
            <li class="flex items-start">
              <span
                class="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0"
                >4</span
              >
              <span
                >Once active, you can login and access the agent portal</span
              >
            </li>
          </ol>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <router-link
            :to="`/agent/track/${trackingNumber}`"
            class="block w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Track Application Status
          </router-link>

          <router-link
            to="/agent"
            class="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Return to Agent Portal
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const trackingNumber = ref(route.params.trackingNumber as string);
const copied = ref(false);

async function copyTrackingNumber() {
  try {
    // Try modern clipboard API first (requires HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(trackingNumber.value);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    } else {
      // Fallback for older browsers or non-HTTPS contexts
      fallbackCopyTextToClipboard(trackingNumber.value);
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    // Fallback if modern API fails
    fallbackCopyTextToClipboard(trackingNumber.value);
  }
}

function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    } else {
      // If both methods fail, show an error or alternative
      alert(
        'Unable to copy to clipboard. Please manually copy the tracking number.'
      );
    }
  } catch (err) {
    console.error('Fallback copy failed: ', err);
    alert(
      'Unable to copy to clipboard. Please manually copy the tracking number.'
    );
  }

  document.body.removeChild(textArea);
}
</script>
