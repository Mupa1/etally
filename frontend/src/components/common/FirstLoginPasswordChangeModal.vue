<template>
  <Modal
    v-model="isModalOpen"
    title="Change Your Password"
    size="md"
    :closeable="false"
    :close-on-backdrop="false"
  >
    <!-- Warning Icon and Message -->
    <div class="sm:flex sm:items-start mb-4">
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
      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
        <p class="text-sm text-gray-500">
          For security reasons, you must change your password before continuing.
          This is required for the initial super administrator account.
        </p>
      </div>
    </div>

    <!-- Alert for errors -->
    <Alert v-if="error" type="error" :message="error" class="mb-4" />

    <!-- Password form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- New Password -->
      <PasswordInput
        v-model="form.newPassword"
        label="New Password"
        placeholder="Enter new password"
        autocomplete="new-password"
        required
        :disabled="loading"
        @input="validatePassword"
      />

      <!-- Password Strength Indicator -->
      <PasswordStrengthIndicator
        ref="strengthIndicator"
        :password="form.newPassword"
      />

      <!-- Confirm Password -->
      <PasswordInput
        v-model="form.confirmPassword"
        label="Confirm New Password"
        placeholder="Confirm new password"
        autocomplete="new-password"
        required
        :disabled="loading"
        :error="passwordMismatchError"
      />
    </form>

    <!-- Footer with action button -->
    <template #footer>
      <div class="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          :loading="loading"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          Change Password
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue';
import Modal from './Modal.vue';
import Alert from './Alert.vue';
import Button from './Button.vue';
import PasswordInput from './PasswordInput.vue';
import PasswordStrengthIndicator from './PasswordStrengthIndicator.vue';

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
const strengthIndicator = ref<InstanceType<
  typeof PasswordStrengthIndicator
> | null>(null);

// Sync internal modal state with prop
const isModalOpen = computed({
  get: () => props.isOpen,
  set: () => {
    // Modal cannot be closed by user in this case (closeable=false)
  },
});

// Password mismatch error message
const passwordMismatchError = computed(() => {
  if (form.confirmPassword && form.newPassword !== form.confirmPassword) {
    return 'Passwords do not match';
  }
  return undefined;
});

// Validate password on input
function validatePassword() {
  error.value = null;
}

// Check if form is valid
const isFormValid = computed(() => {
  const strengthValid = strengthIndicator.value?.isValid ?? false;
  const passwordsMatch =
    form.confirmPassword.length >= 8 &&
    form.newPassword === form.confirmPassword;

  return strengthValid && passwordsMatch;
});

async function handleSubmit() {
  error.value = null;

  // Validate passwords match
  if (form.newPassword !== form.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }

  // Validate password strength using the indicator
  if (!strengthIndicator.value?.isValid) {
    error.value = 'Please ensure all password requirements are met';
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
