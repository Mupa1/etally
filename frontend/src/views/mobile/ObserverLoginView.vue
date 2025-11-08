<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="bg-white shadow-lg rounded-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">
            Observer Portal Login
          </h1>
          <p class="text-gray-600">Login to submit election results</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <FormField
              v-model="form.identifier"
              label="Email or National ID"
              type="text"
              placeholder="email@example.com or 12345678"
              required
            />

            <PasswordInput
              v-model="form.password"
              label="Password"
              placeholder="Enter password"
              required
            />
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            :loading="submitting"
            full-width
            class="mt-6"
            size="lg"
          >
            Login
          </Button>
        </form>

        <!-- Connection Status -->
        <Alert
          v-if="connectionStatus === 'checking'"
          variant="info"
          message="Checking server connection..."
          class="mt-4"
        />
        <Alert
          v-if="connectionStatus === 'failed'"
          variant="danger"
          :message="`Unable to connect to server. Please verify the backend is running and accessible at ${backendUrl || 'http://192.168.178.72:3000'}. Check firewall settings if needed.`"
          class="mt-4"
        />

        <!-- Error Display -->
        <Alert v-if="error" variant="danger" :message="error" class="mt-4" />

        <!-- Links -->
        <div class="mt-6 text-center space-y-2">
          <router-link
            to="/agent"
            class="block text-sm text-gray-600 hover:text-gray-700 mb-3"
          >
            ← Back to Agent Portal
          </router-link>
          <router-link
            to="/agent/track"
            class="block text-sm text-blue-600 hover:text-blue-700"
          >
            Track Application Status
          </router-link>
          <router-link
            to="/agent/register"
            class="block text-sm text-blue-600 hover:text-blue-700"
          >
            New Observer Registration
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { handleError } from '@/utils/errorHandler';
import { validateFormInput, sanitizeInput } from '@/utils/security';
import api from '@/utils/api';
import { getApiBaseUrl } from '@/utils/api';
import Alert from '@/components/common/Alert.vue';
import Button from '@/components/common/Button.vue';
import PasswordInput from '@/components/common/PasswordInput.vue';
import FormField from '@/components/mobile/FormField.vue';

// Note: Observer login uses /api/v1/auth/login, not /api/agent

const router = useRouter();
const authStore = useAuthStore();

const submitting = ref(false);
const error = ref('');
const connectionStatus = ref<'checking' | 'connected' | 'failed' | null>(null);

const form = ref({
  identifier: '',
  password: '',
});

// Computed property for API base URL to ensure it's reactive
const apiBaseUrl = computed(() => getApiBaseUrl());
const backendUrl = computed(() => apiBaseUrl.value.replace('/api/v1', ''));

// Test backend connectivity on mount
onMounted(async () => {
  connectionStatus.value = 'checking';
  try {
    const currentApiUrl = getApiBaseUrl();
    const currentBackendUrl = currentApiUrl.replace('/api/v1', '');
    const healthUrl = `${currentBackendUrl}/health`;

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      connectionStatus.value = 'connected';
    } else {
      connectionStatus.value = 'failed';
    }
  } catch (err: any) {
    connectionStatus.value = 'failed';
  }
});

async function handleLogin() {
  error.value = '';
  submitting.value = true;

  try {
    // Validate inputs
    const identifierValidation = validateFormInput(
      form.value.identifier,
      'text'
    );
    if (!identifierValidation.isValid) {
      error.value = identifierValidation.error || 'Invalid identifier';
      return;
    }

    // Sanitize inputs
    const sanitizedIdentifier = sanitizeInput(form.value.identifier);
    const sanitizedPassword = sanitizeInput(form.value.password);

    // Login using existing auth store
    await authStore.login({
      email: sanitizedIdentifier,
      password: sanitizedPassword,
    });

    // Redirect to agent dashboard
    router.push('/agent/dashboard');
  } catch (err: any) {
    // Use enhanced error handling
    const recovery = handleError(err, {
      component: 'ObserverLoginView',
      action: 'login',
      metadata: { identifier: form.value.identifier },
    });

    // Extract error message with better network error handling
    if (!err.response) {
      // Network error - connection failed
      const apiBaseUrl = getApiBaseUrl();
      const fullUrl = err.config ? `${apiBaseUrl}${err.config.url}` : 'unknown';
      error.value = `Unable to connect to server at ${fullUrl}. Please check your network connection and verify the backend server is running.`;
    } else {
      error.value =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid credentials';
    }
  } finally {
    submitting.value = false;
  }
}
</script>
