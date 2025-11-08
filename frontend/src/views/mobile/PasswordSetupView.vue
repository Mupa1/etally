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
        <div v-if="success" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div class="flex-1">
              <p class="text-green-800 font-medium">{{ success }}</p>
              <p class="text-green-700 text-sm mt-1">Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api, { getAgentApiBaseUrl } from '@/utils/api';
import { handleError } from '@/utils/errorHandler';
import { useToast } from '@/composables/useToast';
import Alert from '@/components/common/Alert.vue';
import Button from '@/components/common/Button.vue';
import PasswordInput from '@/components/common/PasswordInput.vue';
import PasswordStrengthIndicator from '@/components/common/PasswordStrengthIndicator.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const token = ref((route.query.token as string) || '');
const submitting = ref(false);
const error = ref('');
const success = ref('');
const passwordIndicator = ref<InstanceType<
  typeof PasswordStrengthIndicator
> | null>(null);

// Check if token exists on mount
onMounted(() => {
  if (!token.value) {
    error.value = 'Invalid setup link. Please use the link from your approval email.';
    toast.error('Invalid setup link. Please check your email for the correct link.');
  }
});

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
        baseURL: getAgentApiBaseUrl(),
      }
    );

    if (response.data.success) {
      success.value = response.data.message || 'Password set successfully!';
      // Clear form
      form.value.password = '';
      form.value.confirmPassword = '';
      
      toast.success('Password set successfully! You can now login to your account.');
      
      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/agent/login');
      }, 2000);
    } else {
      const errorMsg = response.data.error || 'Failed to set password';
      error.value = errorMsg;
      toast.error(errorMsg);
    }
  } catch (err: any) {
    // Use enhanced error handling
    const recovery = handleError(err, {
      component: 'PasswordSetupView',
      action: 'password_setup',
      metadata: { token: token.value },
    });

    const errorMsg = err.response?.data?.error || 
                     err.response?.data?.message ||
                     'Failed to set password. The link may have expired.';
    error.value = errorMsg;
    toast.error(errorMsg);
  } finally {
    submitting.value = false;
  }
}
</script>
