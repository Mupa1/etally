<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Back Link -->
      <div class="mb-4">
        <router-link
          to="/agent"
          class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg
            class="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Agent Portal
        </router-link>
      </div>

      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Field Agent Registration
        </h1>
        <p class="text-gray-600">
          Register to become a certified field agent for election monitoring
        </p>
      </div>

      <!-- Progress Steps -->
      <ProgressSteps :steps="steps" :current-step="currentStep" />

      <!-- Form Card -->
      <FormCard>
        <!-- Loading skeleton while form is loading -->
        <div v-if="loading" class="space-y-6">
          <LoadingSkeleton variant="form" />
        </div>

        <!-- Form content -->
        <form v-else @submit.prevent="handleNext">
          <!-- Step 1: Personal Information -->
          <div v-if="currentStep === 0">
            <h2 class="text-xl font-semibold mb-4">Personal Information</h2>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  v-model="form.firstName"
                  label="First Name"
                  placeholder="John"
                  required
                />

                <FormField
                  v-model="form.lastName"
                  label="Last Name"
                  placeholder="Doe"
                  required
                />
              </div>

              <FormField
                v-model="form.nationalId"
                label="National ID Number"
                pattern="^\d{7,8}$"
                placeholder="12345678"
                hint="7-8 digits"
                required
              />

              <FormField
                v-model="form.dateOfBirth"
                label="Date of Birth"
                type="date"
                :max="maxBirthDate"
                hint="Must be at least 18 years old"
                required
              />

              <FormField
                v-model="form.phoneNumber"
                label="Phone Number"
                type="tel"
                pattern="^(\+254|0)[17]\d{8}$"
                placeholder="+254712345678 or 0712345678"
                required
              />

              <FormField
                v-model="form.email"
                label="Email Address"
                type="email"
                placeholder="john.doe@example.com"
              />
            </div>
          </div>

          <!-- Step 2: Preferred Assignment -->
          <div v-if="currentStep === 1">
            <h2 class="text-xl font-semibold mb-4">Preferred Assignment</h2>
            <GeographicCascadeSelector
              ref="geographicSelector"
              v-model:county-id="form.preferredCountyId"
              v-model:constituency-id="form.preferredConstituencyId"
              v-model:ward-id="form.preferredWardId"
              v-model:station-id="form.preferredStationId"
            />
          </div>

          <!-- Step 3: Profile Photo -->
          <div v-if="currentStep === 2">
            <h2 class="text-xl font-semibold mb-4">Profile Photo</h2>
            <p class="text-sm text-gray-600 mb-4">
              Take a selfie or upload a clear photo of yourself for
              identification
            </p>

            <div class="space-y-6">
              <FileUploadField
                v-model="documents.profilePhoto"
                label="Profile Photo"
                :max-size="2 * 1024 * 1024"
                hint="PNG, JPG up to 2MB"
                required
                @error="handleFileError"
              />
            </div>
          </div>

          <!-- Step 4: Terms & Consent -->
          <div v-if="currentStep === 3">
            <h2 class="text-xl font-semibold mb-4">Terms and Consent</h2>

            <div class="space-y-4">
              <div
                class="border border-gray-200 rounded-lg p-4 h-48 overflow-y-auto bg-gray-50"
              >
                <h3 class="font-semibold mb-2">Terms and Conditions</h3>
                <p class="text-sm text-gray-700">
                  By registering as a field agent, you agree to:
                </p>
                <ul
                  class="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1"
                >
                  <li>Provide accurate and truthful information</li>
                  <li>Follow all election agent guidelines</li>
                  <li>Maintain confidentiality of sensitive information</li>
                  <li>Submit election results accurately and promptly</li>
                  <li>Report any irregularities or incidents</li>
                </ul>
              </div>

              <div class="flex items-start">
                <input
                  v-model="form.termsAccepted"
                  type="checkbox"
                  required
                  class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 text-sm text-gray-700">
                  I accept the terms and conditions
                  <span class="text-red-500">*</span>
                </label>
              </div>

              <div class="flex items-start">
                <input
                  v-model="form.dataProcessingConsent"
                  type="checkbox"
                  required
                  class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 text-sm text-gray-700">
                  I consent to the processing of my personal data for election
                  agent management
                  <span class="text-red-500">*</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-8">
            <Button
              v-if="currentStep > 0"
              type="button"
              variant="secondary"
              @click="handlePrevious"
            >
              Previous
            </Button>
            <div v-else></div>

            <Button
              v-if="currentStep < steps.length - 1"
              type="submit"
              variant="primary"
            >
              Next
            </Button>
            <Button
              v-else
              type="submit"
              variant="success"
              :disabled="!canSubmit"
              :loading="submitting"
            >
              Submit Application
            </Button>
          </div>
        </form>

        <!-- Error Display -->
        <Alert v-if="error" variant="danger" :message="error" class="mt-4" />
      </FormCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import api, { getAgentApiBaseUrl } from '@/utils/api';
import { handleError } from '@/utils/errorHandler';
import {
  validateFormInput,
  validateFileUpload,
  sanitizeInput,
} from '@/utils/security';
import {
  optimizeImage,
  validateImageFile,
  getOptimalImageSettings,
} from '@/utils/imageOptimization';
import { performanceMonitor } from '@/utils/bundleOptimization';
import { ProgressiveFormSaver } from '@/utils/progressiveFormSaving';
import {
  addTouchInteractions,
  addHapticFeedback,
} from '@/utils/mobileTouchInteractions';
import Alert from '@/components/common/Alert.vue';
import Button from '@/components/common/Button.vue';
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue';
import FormCard from '@/components/mobile/FormCard.vue';
import FormField from '@/components/mobile/FormField.vue';
import FileUploadField from '@/components/mobile/FileUploadField.vue';
import GeographicCascadeSelector from '@/components/mobile/GeographicCascadeSelector.vue';
import ProgressSteps from '@/components/mobile/ProgressSteps.vue';

const router = useRouter();
const geographicSelector = ref<InstanceType<
  typeof GeographicCascadeSelector
> | null>(null);

const steps = [
  'Personal Info',
  'Preferred Location',
  'Profile Photo',
  'Terms & Consent',
];
const currentStep = ref(0);
const submitting = ref(false);
const error = ref('');
const loading = ref(false);

// Progressive form saving
const formSaver = new ProgressiveFormSaver('observer-registration', {
  autoSaveInterval: 30000, // 30 seconds
  debounceDelay: 1000, // 1 second
});

// Performance monitoring
onMounted(() => {
  performanceMonitor.mark('observer-register-mounted');

  // Always start with a clean slate to avoid prefilled data
  formSaver.clearFormData();

  // Start auto-saving (only for the current session)
  formSaver.startAutoSave(form.value);

  // Add touch interactions to form elements
  const formElements = document.querySelectorAll('input, button, select');
  formElements.forEach((element) => {
    addTouchInteractions(element as HTMLElement);
  });
});

onUnmounted(() => {
  performanceMonitor.measure(
    'observer-register-lifetime',
    'observer-register-mounted'
  );

  // Stop auto-saving
  formSaver.stopAutoSave();

  // Ensure no residual data remains when leaving the page
  formSaver.clearFormData();
});

// Form data
const form = ref({
  firstName: '',
  lastName: '',
  nationalId: '',
  dateOfBirth: '',
  phoneNumber: '',
  email: '',
  preferredCountyId: '',
  preferredConstituencyId: '',
  preferredWardId: '',
  preferredStationId: '',
  termsAccepted: false,
  dataProcessingConsent: false,
});

// Document files
const documents = ref<{
  profilePhoto: File | null;
}>({
  profilePhoto: null,
});

// Max birth date (18 years ago)
const maxBirthDate = computed(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().split('T')[0];
});

// Can submit check
const canSubmit = computed(() => {
  return (
    form.value.termsAccepted &&
    form.value.dataProcessingConsent &&
    documents.value.profilePhoto
  );
});

// Watch for form changes and auto-save
watch(
  form,
  (newForm) => {
    formSaver.debouncedSave(newForm);
  },
  { deep: true }
);

watch(
  currentStep,
  (step) => {
    if (step === 1) {
      nextTick(() => {
        geographicSelector.value?.reloadHierarchy?.();
      });
    }
  },
  { immediate: true }
);

// Handle file upload errors
function handleFileError(message: string) {
  error.value = message;
}

// Navigate to next step
function handleNext() {
  error.value = '';

  // Add haptic feedback
  addHapticFeedback(document.body, 'light');

  // Validate current step
  if (currentStep.value === 0) {
    if (!validatePersonalInfo()) return;
  } else if (currentStep.value === 1) {
    if (!validatePreferredAssignment()) return;
  } else if (currentStep.value === 2) {
    if (!validateDocuments()) return;
  }

  // Save form data before moving to next step
  formSaver.saveFormData(form.value);

  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  } else {
    submitRegistration();
  }
}

// Navigate to previous step
function handlePrevious() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

// Validate personal info
function validatePersonalInfo(): boolean {
  if (!form.value.firstName || !form.value.lastName) {
    error.value = 'Please fill in all required fields';
    return false;
  }

  // Validate national ID
  const nationalIdValidation = validateFormInput(
    form.value.nationalId,
    'nationalId'
  );
  if (!nationalIdValidation.isValid) {
    error.value = nationalIdValidation.error || 'Invalid national ID';
    return false;
  }

  // Validate phone number
  const phoneValidation = validateFormInput(form.value.phoneNumber, 'phone');
  if (!phoneValidation.isValid) {
    error.value = phoneValidation.error || 'Invalid phone number';
    return false;
  }

  // Validate email if provided
  if (form.value.email) {
    const emailValidation = validateFormInput(form.value.email, 'email');
    if (!emailValidation.isValid) {
      error.value = emailValidation.error || 'Invalid email';
      return false;
    }
  }

  return true;
}

// Validate preferred assignment
function validatePreferredAssignment(): boolean {
  if (!form.value.preferredCountyId) {
    error.value = 'Please select your preferred county before proceeding.';
    return false;
  }
  return true;
}

// Validate documents
function validateDocuments(): boolean {
  if (!documents.value.profilePhoto) {
    error.value = 'Please upload your profile photo';
    return false;
  }

  // Validate image file
  const imageValidation = validateImageFile(documents.value.profilePhoto);
  if (!imageValidation.isValid) {
    error.value = imageValidation.error || 'Invalid image file';
    return false;
  }

  // Validate file upload
  const fileValidation = validateFileUpload(documents.value.profilePhoto);
  if (!fileValidation.isValid) {
    error.value = fileValidation.error || 'Invalid file';
    return false;
  }

  return true;
}

// Submit registration
async function submitRegistration() {
  submitting.value = true;
  error.value = '';

  try {
    // 1. Submit registration
    const registrationData = {
      ...form.value,
      // Sanitize all text inputs
      firstName: sanitizeInput(form.value.firstName),
      lastName: sanitizeInput(form.value.lastName),
      nationalId: sanitizeInput(form.value.nationalId),
      phoneNumber: sanitizeInput(form.value.phoneNumber),
      email: form.value.email
        ? sanitizeInput(form.value.email)
        : undefined,
      dateOfBirth: new Date(form.value.dateOfBirth).toISOString(),
      // Convert empty strings to undefined for optional fields
      preferredCountyId: form.value.preferredCountyId || undefined,
      preferredConstituencyId: form.value.preferredConstituencyId || undefined,
      preferredWardId: form.value.preferredWardId || undefined,
      preferredStationId: form.value.preferredStationId || undefined,
    };

    console.log('Submitting registration:', registrationData);

    const response = await api.post('/agent/register', registrationData, {
      baseURL: getAgentApiBaseUrl(),
    });

    console.log('Registration response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Registration failed');
    }

    // Extract trackingNumber from response
    const trackingNumber =
      response.data.trackingNumber || response.data.data?.trackingNumber;

    console.log('Tracking number:', trackingNumber);

    if (!trackingNumber) {
      throw new Error('Failed to get tracking number from server');
    }

    // 2. Upload documents
    if (documents.value.profilePhoto) {
      console.log('Uploading documents...');
      await uploadDocuments(trackingNumber);
      console.log('Documents uploaded successfully');
    }

    // Clear saved form data on successful submission
    formSaver.clearFormData();

    // Add success haptic feedback
    addHapticFeedback(document.body, 'success');

    // 3. Redirect to success page
    console.log('Redirecting to success page...');
    router.push({
      name: 'observer-registration-success',
      params: { trackingNumber },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    console.error('Error response:', err.response?.data);

    // Use enhanced error handling
    const recovery = handleError(err, {
      component: 'ObserverRegisterView',
      action: 'form_submission',
      metadata: { step: currentStep.value },
    });

    // Add error haptic feedback
    addHapticFeedback(document.body, 'error');

    error.value =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Registration failed';
  } finally {
    submitting.value = false;
  }
}

// Upload documents
async function uploadDocuments(trackingNumber: string) {
  if (!documents.value.profilePhoto) return;

  try {
    // Check if we can optimize the image without running out of memory
    const shouldOptimize = documents.value.profilePhoto.size > 500 * 1024; // Only optimize if > 500KB

    if (shouldOptimize) {
      try {
        // Optimize image before upload with device-appropriate settings
        const optimalSettings = getOptimalImageSettings();
        const optimizedImage = await optimizeImage(
          documents.value.profilePhoto,
          optimalSettings
        );

        const formData = new FormData();
        formData.append('file', optimizedImage.file);
        formData.append('documentType', 'profile_photo');

        await api.post(
          `/agent/register/${trackingNumber}/upload-document`,
          formData,
          {
            baseURL: getAgentApiBaseUrl(),
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        console.log(
          `Image optimized: ${optimizedImage.compressionRatio.toFixed(2)}x compression`
        );
        return;
      } catch (optimizationError) {
        console.error('Image optimization failed:', optimizationError);
        // Fall through to upload original file
      }
    }

    // Upload original file (either because it's small or optimization failed)
    const formData = new FormData();
    formData.append('file', documents.value.profilePhoto);
    formData.append('documentType', 'profile_photo');

    await api.post(
      `/agent/register/${trackingNumber}/upload-document`,
      formData,
      {
        baseURL: '/api',
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    console.log('Original file uploaded successfully');
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error('Failed to upload profile photo. Please try again.');
  }
}
</script>
