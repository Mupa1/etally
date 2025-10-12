<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 px-4"
  >
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
        <Alert
          v-if="authStore.error"
          variant="danger"
          :message="authStore.error"
          class="mb-4"
        />

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
              <LoadingSpinner size="md" class="mr-2" />
              Signing In...
            </span>
          </button>
        </form>

        <!-- Register Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <router-link
              to="/register"
              class="text-primary-600 hover:text-primary-700 font-medium"
            >
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

    <!-- First Login Password Change Modal -->
    <FirstLoginPasswordChangeModal
      :is-open="showPasswordChangeModal"
      @submit="handlePasswordChange"
      ref="passwordChangeModalRef"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Alert from '@/components/common/Alert.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import FirstLoginPasswordChangeModal from '@/components/common/FirstLoginPasswordChangeModal.vue';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const showPasswordChangeModal = ref(false);
const passwordChangeModalRef = ref<InstanceType<typeof FirstLoginPasswordChangeModal> | null>(null);

async function handleLogin() {
  try {
    const result = await authStore.login({
      email: form.email,
      password: form.password,
      deviceInfo: {
        deviceName: 'Web Browser',
        deviceModel: navigator.userAgent,
        osVersion: navigator.platform,
        appVersion: '1.0.0',
      },
    });

    // Check if password change is required
    if (result.requiresPasswordChange) {
      showPasswordChangeModal.value = true;
    } else {
      // Redirect to intended page or dashboard
      const redirect = router.currentRoute.value.query.redirect as string;
      router.push(redirect || '/dashboard');
    }
  } catch (error) {
    // Error is handled in store
    console.error('Login failed:', error);
  }
}

async function handlePasswordChange(newPassword: string) {
  try {
    await authStore.firstLoginPasswordChange(newPassword);
    
    // Password changed successfully, show success message and redirect to login
    showPasswordChangeModal.value = false;
    
    // Show success message
    alert('Password changed successfully! Please login again with your new password.');
    
    // Clear form
    form.email = '';
    form.password = '';
  } catch (error: any) {
    // Set error in modal
    if (passwordChangeModalRef.value) {
      passwordChangeModalRef.value.setError(
        error.response?.data?.message || 'Failed to change password'
      );
    }
    console.error('Password change failed:', error);
  }
}
</script>
