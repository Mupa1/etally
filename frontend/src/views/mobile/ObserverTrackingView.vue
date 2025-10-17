<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Track Observer Application
        </h1>
        <p class="text-gray-600">
          Check the status of your observer registration application
        </p>
      </div>

      <!-- Tracking Number Input -->
      <FormCard v-if="!trackingNumber" class="mb-6">
        <form @submit.prevent="trackApplication">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Enter Tracking Number
          </label>
          <div class="flex gap-2">
            <input
              v-model="trackingInput"
              type="text"
              required
              pattern="OBS-\d{4}-\d{6}"
              placeholder="OBS-2024-001234"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Button type="submit" :loading="loading"> Track </Button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Format: OBS-YYYY-XXXXXX (e.g., OBS-2024-001234)
          </p>
        </form>
      </FormCard>

      <!-- Application Status -->
      <FormCard v-if="application">
        <!-- Status Badge -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            Application Status
          </h2>
          <Badge :variant="statusVariant" :label="statusLabel" size="lg" />
        </div>

        <!-- Tracking Number -->
        <div class="mb-6">
          <p class="text-sm text-gray-600">Tracking Number:</p>
          <p class="text-lg font-mono font-semibold text-gray-900">
            {{ application.trackingNumber }}
          </p>
        </div>

        <!-- Timeline -->
        <div class="space-y-4 mb-6">
          <div class="flex items-start">
            <div class="bg-green-500 w-3 h-3 rounded-full mt-1 mr-3"></div>
            <div>
              <p class="font-medium text-gray-900">Application Submitted</p>
              <p class="text-sm text-gray-600">
                {{ formatDate(application.submissionDate) }}
              </p>
            </div>
          </div>

          <div v-if="application.reviewDate" class="flex items-start">
            <div
              :class="
                application.status === 'rejected'
                  ? 'bg-red-500'
                  : 'bg-green-500'
              "
              class="w-3 h-3 rounded-full mt-1 mr-3"
            ></div>
            <div>
              <p class="font-medium text-gray-900">Application Reviewed</p>
              <p class="text-sm text-gray-600">
                {{ formatDate(application.reviewDate) }}
              </p>
            </div>
          </div>

          <div v-else class="flex items-start">
            <div class="bg-gray-300 w-3 h-3 rounded-full mt-1 mr-3"></div>
            <div>
              <p class="font-medium text-gray-500">Under Review</p>
              <p class="text-sm text-gray-500">
                Estimated time: {{ application.estimatedReviewTime }}
              </p>
            </div>
          </div>
        </div>

        <!-- Status Message -->
        <Alert
          :variant="statusAlertVariant"
          :message="application.statusMessage"
        />

        <!-- Actions -->
        <div class="mt-6 flex gap-3">
          <Button
            @click="refreshStatus"
            :loading="loading"
            variant="secondary"
            class="flex-1"
          >
            Refresh Status
          </Button>
          <router-link to="/mobile/register" class="flex-1">
            <Button variant="primary" full-width> New Application </Button>
          </router-link>
        </div>
      </FormCard>

      <!-- Error Display -->
      <Alert v-if="error" variant="danger" :message="error" class="mt-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/utils/api';
import Alert from '@/components/common/Alert.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import FormCard from '@/components/mobile/FormCard.vue';

const route = useRoute();
const trackingNumber = ref((route.params.trackingNumber as string) || '');
const trackingInput = ref('');
const application = ref<any>(null);
const loading = ref(false);
const error = ref('');

// Status display mapping
const statusLabels: Record<string, string> = {
  pending_review: 'Under Review',
  approved: 'Approved',
  active: 'Active',
  rejected: 'Rejected',
  suspended: 'Suspended',
  inactive: 'Inactive',
};

const statusVariants: Record<
  string,
  'warning' | 'success' | 'primary' | 'danger' | 'secondary' | 'gray'
> = {
  pending_review: 'warning',
  approved: 'success',
  active: 'primary',
  rejected: 'danger',
  suspended: 'secondary',
  inactive: 'gray',
};

const statusLabel = computed(
  () => statusLabels[application.value?.status] || 'Unknown'
);

const statusVariant = computed(
  () => statusVariants[application.value?.status] || 'gray'
);

const statusAlertVariant = computed(() => {
  if (application.value?.status === 'approved') return 'success';
  if (application.value?.status === 'rejected') return 'danger';
  return 'info';
});

// Track application on mount if tracking number in route
onMounted(() => {
  if (trackingNumber.value) {
    fetchApplicationStatus(trackingNumber.value);
  }
});

// Track application
async function trackApplication() {
  error.value = '';

  if (!trackingInput.value) {
    error.value = 'Please enter a tracking number';
    return;
  }

  trackingNumber.value = trackingInput.value;
  await fetchApplicationStatus(trackingInput.value);
}

// Fetch application status
async function fetchApplicationStatus(number: string) {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get(`/mobile/track/${number}`, {
      baseURL: '/api',
    });
    application.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Application not found';
    application.value = null;
  } finally {
    loading.value = false;
  }
}

// Refresh status
async function refreshStatus() {
  if (trackingNumber.value) {
    await fetchApplicationStatus(trackingNumber.value);
  }
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
