<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Background backdrop -->
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
      ></div>

      <!-- Center modal -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
        >&#8203;</span
      >

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
              <h3
                class="text-lg leading-6 font-medium text-gray-900"
                id="modal-title"
              >
                Change Your Password
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  For security reasons, you must change your password before
                  continuing. This is required for the initial super
                  administrator account.
                </p>
              </div>

              <!-- Alert for errors -->
              <Alert v-if="error" type="error" :message="error" class="mt-4" />

              <!-- Password form -->
              <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                <!-- New Password -->
                <div>
                  <label
                    for="newPassword"
                    class="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <div class="relative mt-1">
                    <input
                      :type="showNewPassword ? 'text' : 'password'"
                      id="newPassword"
                      v-model="form.newPassword"
                      required
                      class="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Enter new password"
                      :disabled="loading"
                      @input="validatePassword"
                    />
                    <button
                      type="button"
                      @click="showNewPassword = !showNewPassword"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      :disabled="loading"
                    >
                      <svg
                        v-if="!showNewPassword"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Password Strength Checklist -->
                  <div class="mt-3 space-y-2">
                    <p class="text-xs font-medium text-gray-700">
                      Password Requirements:
                    </p>
                    <ul class="space-y-1">
                      <li
                        :class="
                          passwordChecks.length
                            ? 'text-green-600'
                            : 'text-gray-500'
                        "
                        class="flex items-center text-xs"
                      >
                        <svg
                          class="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            v-if="passwordChecks.length"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                          <circle
                            v-else
                            cx="12"
                            cy="12"
                            r="10"
                            stroke-width="2"
                          />
                        </svg>
                        At least 8 characters
                      </li>
                      <li
                        :class="
                          passwordChecks.uppercase
                            ? 'text-green-600'
                            : 'text-gray-500'
                        "
                        class="flex items-center text-xs"
                      >
                        <svg
                          class="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            v-if="passwordChecks.uppercase"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                          <circle
                            v-else
                            cx="12"
                            cy="12"
                            r="10"
                            stroke-width="2"
                          />
                        </svg>
                        One uppercase letter (A-Z)
                      </li>
                      <li
                        :class="
                          passwordChecks.lowercase
                            ? 'text-green-600'
                            : 'text-gray-500'
                        "
                        class="flex items-center text-xs"
                      >
                        <svg
                          class="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            v-if="passwordChecks.lowercase"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                          <circle
                            v-else
                            cx="12"
                            cy="12"
                            r="10"
                            stroke-width="2"
                          />
                        </svg>
                        One lowercase letter (a-z)
                      </li>
                      <li
                        :class="
                          passwordChecks.number
                            ? 'text-green-600'
                            : 'text-gray-500'
                        "
                        class="flex items-center text-xs"
                      >
                        <svg
                          class="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            v-if="passwordChecks.number"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                          <circle
                            v-else
                            cx="12"
                            cy="12"
                            r="10"
                            stroke-width="2"
                          />
                        </svg>
                        One number (0-9)
                      </li>
                      <li
                        :class="
                          passwordChecks.special
                            ? 'text-green-600'
                            : 'text-gray-500'
                        "
                        class="flex items-center text-xs"
                      >
                        <svg
                          class="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            v-if="passwordChecks.special"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                          <circle
                            v-else
                            cx="12"
                            cy="12"
                            r="10"
                            stroke-width="2"
                          />
                        </svg>
                        One special character (!@#$%^&*)
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label
                    for="confirmPassword"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <div class="relative mt-1">
                    <input
                      :type="showConfirmPassword ? 'text' : 'password'"
                      id="confirmPassword"
                      v-model="form.confirmPassword"
                      required
                      class="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Confirm new password"
                      :disabled="loading"
                    />
                    <button
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      :disabled="loading"
                    >
                      <svg
                        v-if="!showConfirmPassword"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                  <p
                    v-if="
                      form.confirmPassword &&
                      form.newPassword !== form.confirmPassword
                    "
                    class="mt-1 text-xs text-red-600"
                  >
                    Passwords do not match
                  </p>
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
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const passwordChecks = reactive({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false,
});

function validatePassword() {
  const password = form.newPassword;

  // Check length (at least 8 characters)
  passwordChecks.length = password.length >= 8;

  // Check for uppercase letter
  passwordChecks.uppercase = /[A-Z]/.test(password);

  // Check for lowercase letter
  passwordChecks.lowercase = /[a-z]/.test(password);

  // Check for number
  passwordChecks.number = /[0-9]/.test(password);

  // Check for special character
  passwordChecks.special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
}

const isFormValid = computed(() => {
  return (
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special &&
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
    showNewPassword.value = false;
    showConfirmPassword.value = false;
    passwordChecks.length = false;
    passwordChecks.uppercase = false;
    passwordChecks.lowercase = false;
    passwordChecks.number = false;
    passwordChecks.special = false;
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
