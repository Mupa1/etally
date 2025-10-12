<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 px-4"
  >
    <div class="max-w-md w-full">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">eTally</h1>
        <p class="text-primary-100">Election Management System</p>
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
            <PasswordInput
              v-model="form.password"
              label="Password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              :disabled="authStore.loading"
            />
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            variant="primary"
            full-width
            :loading="authStore.loading"
            :disabled="authStore.loading"
          >
            Sign In
          </Button>
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
          © 2025 Election Management System
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
import Button from '@/components/common/Button.vue';
import PasswordInput from '@/components/common/PasswordInput.vue';
import FirstLoginPasswordChangeModal from '@/components/common/FirstLoginPasswordChangeModal.vue';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const showPasswordChangeModal = ref(false);
const passwordChangeModalRef = ref<InstanceType<
  typeof FirstLoginPasswordChangeModal
> | null>(null);

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

    // Password changed successfully, close modal and redirect to login
    showPasswordChangeModal.value = false;

    // Clear form so user can login with new password
    form.email = '';
    form.password = '';

    // Reset modal state
    if (passwordChangeModalRef.value) {
      passwordChangeModalRef.value.resetForm();
    }
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
