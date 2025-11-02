<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Back Link -->
      <div class="mb-4">
        <router-link
          :to="`/agent/track/${trackingNumber}`"
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
          Back to Application Status
        </router-link>
      </div>

      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Update Application Information
        </h1>
        <p class="text-gray-600">
          Please review and update the requested information
        </p>
      </div>

      <!-- Review Notes Alert -->
      <Alert
        v-if="application?.reviewNotes"
        variant="warning"
        :message="`Review Notes: ${application.reviewNotes}`"
        class="mb-6"
      />

      <!-- Loading State -->
      <FormCard v-if="loading">
        <div class="text-center py-8">
          <p class="text-gray-600">Loading application details...</p>
        </div>
      </FormCard>

      <!-- Form -->
      <FormCard v-else-if="application">
        <form @submit.prevent="handleSubmit">
          <div class="space-y-6">
            <!-- Personal Information Section -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h2>
              <div class="space-y-4">
                <FormField
                  v-model="form.firstName"
                  type="text"
                  label="First Name"
                  placeholder="Enter first name"
                  required
                />
                <FormField
                  v-model="form.lastName"
                  type="text"
                  label="Last Name"
                  placeholder="Enter last name"
                  required
                />
                <FormField
                  v-model="form.nationalId"
                  type="text"
                  label="National ID"
                  placeholder="Enter national ID"
                  required
                  :disabled="true"
                />
                <FormField
                  v-model="form.dateOfBirth"
                  type="date"
                  label="Date of Birth"
                  required
                  :max="maxBirthDate"
                />
              </div>
            </div>

            <!-- Contact Information Section -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div class="space-y-4">
                <FormField
                  v-model="form.phoneNumber"
                  type="tel"
                  label="Phone Number"
                  placeholder="+254XXXXXXXXX"
                  required
                />
                <FormField
                  v-model="form.email"
                  type="email"
                  label="Email Address"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <!-- Preferred Location Section -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                Preferred Assignment Location
              </h2>
              <GeographicCascadeSelector
                v-model:countyId="form.preferredCountyId"
                v-model:constituencyId="form.preferredConstituencyId"
                v-model:wardId="form.preferredWardId"
                v-model:stationId="form.preferredStationId"
                :show-polling-stations="true"
                show-help-text
              />
            </div>
          </div>

          <!-- Submit Button -->
          <div class="mt-8 flex gap-3">
            <router-link :to="`/agent/track/${trackingNumber}`" class="flex-1">
              <Button variant="secondary" full-width> Cancel </Button>
            </router-link>
            <Button
              type="submit"
              :loading="submitting"
              variant="primary"
              class="flex-1"
            >
              Update Application
            </Button>
          </div>
        </form>
      </FormCard>

      <!-- Error Display -->
      <Alert v-if="error" variant="danger" :message="error" class="mt-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { handleError } from '@/utils/errorHandler';
import { useToast } from '@/composables/useToast';
import Alert from '@/components/common/Alert.vue';
import Button from '@/components/common/Button.vue';
import FormCard from '@/components/mobile/FormCard.vue';
import FormField from '@/components/mobile/FormField.vue';
import GeographicCascadeSelector from '@/components/mobile/GeographicCascadeSelector.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const trackingNumber = ref((route.params.trackingNumber as string) || '');
const application = ref<any>(null);
const loading = ref(false);
const submitting = ref(false);
const error = ref('');

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
});

// Max birth date (18 years ago)
const maxBirthDate = computed(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().split('T')[0];
});

// Load application details
async function loadApplication() {
  if (!trackingNumber.value) {
    error.value = 'Invalid tracking number';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await api.get(
      `/agent/application/${trackingNumber.value}`,
      {
        baseURL: '/api',
      }
    );

    if (response.data.success) {
      application.value = response.data.data;

      // Populate form with existing data
      form.value = {
        firstName: application.value.firstName || '',
        lastName: application.value.lastName || '',
        nationalId: application.value.nationalId || '',
        dateOfBirth: application.value.dateOfBirth
          ? new Date(application.value.dateOfBirth).toISOString().split('T')[0]
          : '',
        phoneNumber: application.value.phoneNumber || '',
        email: application.value.email || '',
        preferredCountyId: application.value.preferredCountyId || '',
        preferredConstituencyId:
          application.value.preferredConstituencyId || '',
        preferredWardId: application.value.preferredWardId || '',
        preferredStationId: application.value.preferredStationId || '',
      };

      // Check if status allows editing
      if (application.value.status !== 'more_information_requested') {
        error.value =
          'Application can only be updated when more information is requested';
        toast.error('Application cannot be updated at this time');
      }
    } else {
      error.value = response.data.error || 'Failed to load application';
    }
  } catch (err: any) {
    const recovery = handleError(err, {
      component: 'ObserverApplicationEditView',
      action: 'load_application',
      metadata: { trackingNumber: trackingNumber.value },
    });

    error.value =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Failed to load application details';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

// Submit form
async function handleSubmit() {
  if (application.value?.status !== 'more_information_requested') {
    error.value =
      'Application can only be updated when more information is requested';
    toast.error('Application cannot be updated at this time');
    return;
  }

  error.value = '';
  submitting.value = true;

  try {
    const updateData = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      phoneNumber: form.value.phoneNumber,
      email: form.value.email,
      dateOfBirth: new Date(form.value.dateOfBirth).toISOString(),
      preferredCountyId: form.value.preferredCountyId || undefined,
      preferredConstituencyId: form.value.preferredConstituencyId || undefined,
      preferredWardId: form.value.preferredWardId || undefined,
      preferredStationId: form.value.preferredStationId || undefined,
    };

    const response = await api.put(
      `/agent/application/${trackingNumber.value}`,
      updateData,
      {
        baseURL: '/api',
      }
    );

    if (response.data.success) {
      toast.success('Application updated successfully!');

      // Redirect back to tracking page after a short delay
      setTimeout(() => {
        router.push(`/agent/track/${trackingNumber.value}`);
      }, 1500);
    } else {
      const errorMsg = response.data.error || 'Failed to update application';
      error.value = errorMsg;
      toast.error(errorMsg);
    }
  } catch (err: any) {
    const recovery = handleError(err, {
      component: 'ObserverApplicationEditView',
      action: 'update_application',
      metadata: { trackingNumber: trackingNumber.value },
    });

    const errorMsg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Failed to update application';
    error.value = errorMsg;
    toast.error(errorMsg);
  } finally {
    submitting.value = false;
  }
}

// Load application on mount
onMounted(() => {
  if (trackingNumber.value) {
    loadApplication();
  } else {
    error.value = 'Invalid tracking number';
  }
});
</script>
