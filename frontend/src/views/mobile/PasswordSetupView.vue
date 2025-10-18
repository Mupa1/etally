<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="bg-white shadow-lg rounded-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">
            Set Up Your Password
          </h1>
          <p class="text-gray-600">
            Create a secure password for your observer account
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <!-- Password -->
            <PasswordInput
              v-model="form.password"
              label="Password"
              placeholder="Enter password"
              required
              autocomplete="new-password"
              @update:model-value="validatePassword"
            />

            <!-- Password Requirements -->
            <PasswordStrengthIndicator
              :password="form.password"
              ref="passwordIndicator"
            />

            <!-- Confirm Password -->
            <PasswordInput
              v-model="form.confirmPassword"
              label="Confirm Password"
              placeholder="Confirm password"
              required
              autocomplete="new-password"
              :error="
                form.confirmPassword && !passwordsMatch
                  ? 'Passwords do not match'
                  : ''
              "
            />
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            :disabled="!isValidPassword || !passwordsMatch"
            :loading="submitting"
            full-width
            variant="primary"
            size="lg"
            class="mt-6"
          >
            Set Password & Activate Account
          </Button>
        </form>

        <!-- Error Display -->
        <Alert v-if="error" variant="danger" :message="error" class="mt-4" />

        <!-- Success Display -->
        <Alert v-if="success" variant="success" :message="success" class="mt-4">
          <router-link
            to="/agent/login"
            class="block text-center w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Go to Login
          </router-link>
        </Alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/utils/api';
import Alert from '@/components/common/Alert.vue';
import Button from '@/components/common/Button.vue';
import PasswordInput from '@/components/common/PasswordInput.vue';
import PasswordStrengthIndicator from '@/components/common/PasswordStrengthIndicator.vue';

const route = useRoute();
const token = ref((route.query.token as string) || '');
const submitting = ref(false);
const error = ref('');
const success = ref('');
const passwordIndicator = ref<InstanceType<
  typeof PasswordStrengthIndicator
> | null>(null);

const form = ref({
  password: '',
  confirmPassword: '',
});

// Validate password requirements
function validatePassword() {
  // The PasswordStrengthIndicator component handles validation
}

// Check if password is valid
const isValidPassword = computed(() => {
  return passwordIndicator.value?.isValid || false;
});

// Check if passwords match
const passwordsMatch = computed(() => {
  return form.value.password === form.value.confirmPassword;
});

// Submit password setup
async function handleSubmit() {
  error.value = '';
  success.value = '';

  if (!token.value) {
    error.value = 'Invalid setup link. Please use the link from your email.';
    return;
  }

  if (!isValidPassword.value) {
    error.value = 'Please meet all password requirements';
    return;
  }

  if (!passwordsMatch.value) {
    error.value = 'Passwords do not match';
    return;
  }

  submitting.value = true;

  try {
    const response = await api.post(
      '/agent/setup-password',
      {
        token: token.value,
        password: form.value.password,
        confirmPassword: form.value.confirmPassword,
      },
      {
        baseURL: '/api',
      }
    );

    if (response.data.success) {
      success.value = response.data.message;
      // Clear form
      form.value.password = '';
      form.value.confirmPassword = '';
    } else {
      error.value = response.data.error || 'Failed to set password';
    }
  } catch (err: any) {
    error.value =
      err.response?.data?.error ||
      'Failed to set password. The link may have expired.';
  } finally {
    submitting.value = false;
  }
}
</script>
