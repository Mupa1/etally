<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 px-4">
    <div class="max-w-md w-full">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">eTally</h1>
        <p class="text-primary-100">Kenya Election Management System</p>
      </div>

      <!-- Login Card -->
      <div class="card">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

        <!-- Error Message -->
        <div v-if="authStore.error" class="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <p class="text-sm text-danger-800">{{ authStore.error }}</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin">
          <!-- Email Field -->
          <div class="mb-4">
            <label for="email" class="form-label">Email Address</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="your.email@example.com"
              required
              autocomplete="email"
            />
          </div>

          <!-- Password Field -->
          <div class="mb-6">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="w-full btn-primary"
            :disabled="authStore.loading"
          >
            <span v-if="!authStore.loading">Sign In</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing In...
            </span>
          </button>
        </form>

        <!-- Register Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <router-link to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
              Register here
            </router-link>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center">
        <p class="text-sm text-primary-100">
          © 2025 Kenya Election Management System
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

async function handleLogin() {
  try {
    await authStore.login({
      email: form.email,
      password: form.password,
      deviceInfo: {
        deviceName: 'Web Browser',
        deviceModel: navigator.userAgent,
        osVersion: navigator.platform,
        appVersion: '1.0.0',
      },
    });

    // Redirect to intended page or dashboard
    const redirect = router.currentRoute.value.query.redirect as string;
    router.push(redirect || '/dashboard');
  } catch (error) {
    // Error is handled in store
    console.error('Login failed:', error);
  }
}
</script>
