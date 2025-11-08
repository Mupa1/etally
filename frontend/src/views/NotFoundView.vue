<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <!-- Icon -->
      <div class="mb-8">
        <svg
          class="mx-auto h-24 w-24 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <!-- Message -->
      <h1 class="text-3xl font-bold text-gray-900 mb-3">
        Oops! Page Not Found
      </h1>
      <p class="text-lg text-gray-600 mb-2">
        Sorry, the page you tried to access is not available.
      </p>
      <p class="text-sm text-gray-500 mb-8">
        The link you followed may be broken, or the page may have been removed.
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="primary" @click="goToDashboard">
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go to Dashboard
        </Button>
        <Button variant="secondary" @click="goBack">
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Go Back
        </Button>
      </div>

      <!-- Help Links -->
      <div class="mt-8 pt-8 border-t border-gray-200">
        <p class="text-sm text-gray-500 mb-3">Need help?</p>
        <div class="flex justify-center gap-6 text-sm">
          <router-link
            to="/dashboard"
            class="text-primary-600 hover:text-primary-700"
          >
            Dashboard
          </router-link>
          <router-link
            to="/elections"
            class="text-primary-600 hover:text-primary-700"
          >
            Elections
          </router-link>
          <router-link
            to="/results"
            class="text-primary-600 hover:text-primary-700"
          >
            Results
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from '@/components/common/Button.vue';

const router = useRouter();

function goToDashboard() {
  router.push('/dashboard');
}

function goBack() {
  router.back();
}
</script>
