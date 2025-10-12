<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Background backdrop -->
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

      <!-- Center modal -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10"
            >
              <svg
                class="h-6 w-6 text-yellow-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Change Your Password
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  For security reasons, you must change your password before continuing. This is required for the initial super administrator account.
                </p>
              </div>

              <!-- Alert for errors -->
              <Alert v-if="error" type="error" :message="error" class="mt-4" />

              <!-- Password form -->
              <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                <!-- New Password -->
                <div>
                  <label for="newPassword" class="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    v-model="form.newPassword"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter new password"
                    :disabled="loading"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Confirm new password"
                    :disabled="loading"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            @click="handleSubmit"
            :disabled="loading || !isFormValid"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LoadingSpinner v-if="loading" size="sm" class="mr-2" />
            {{ loading ? 'Changing...' : 'Change Password' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import Alert from './Alert.vue';
import LoadingSpinner from './LoadingSpinner.vue';

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: 'submit', newPassword: string): void;
  (e: 'error', error: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const form = reactive({
  newPassword: '',
  confirmPassword: '',
});

const loading = ref(false);
const error = ref<string | null>(null);

const isFormValid = computed(() => {
  return (
    form.newPassword.length >= 8 &&
    form.confirmPassword.length >= 8 &&
    form.newPassword === form.confirmPassword
  );
});

async function handleSubmit() {
  error.value = null;

  // Validate passwords match
  if (form.newPassword !== form.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }

  // Validate password strength
  if (form.newPassword.length < 8) {
    error.value = 'Password must be at least 8 characters';
    return;
  }

  if (!/[A-Z]/.test(form.newPassword)) {
    error.value = 'Password must contain at least one uppercase letter';
    return;
  }

  if (!/[a-z]/.test(form.newPassword)) {
    error.value = 'Password must contain at least one lowercase letter';
    return;
  }

  if (!/[0-9]/.test(form.newPassword)) {
    error.value = 'Password must contain at least one number';
    return;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)) {
    error.value = 'Password must contain at least one special character';
    return;
  }

  loading.value = true;
  emit('submit', form.newPassword);
  
  // Note: The parent component should handle setting loading to false
  // after the API call completes
}

// Expose method to clear form and reset state
defineExpose({
  resetForm: () => {
    form.newPassword = '';
    form.confirmPassword = '';
    error.value = null;
    loading.value = false;
  },
  setError: (err: string) => {
    error.value = err;
    loading.value = false;
  },
  setLoading: (val: boolean) => {
    loading.value = val;
  },
});
</script>

