<template>
  <MainLayout
    page-title="Observer Details"
    page-description="View detailed information about an observer"
  >
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" type="error" :message="error" class="mb-4" />

    <!-- Observer Details -->
    <div v-else-if="observer" class="space-y-6">
      <!-- Header Section -->
      <div class="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4"
        >
          <div class="flex items-start space-x-3 sm:space-x-4 w-full sm:w-auto">
            <Avatar
              :src="imageUrls.profile"
              :initials="`${observer.firstName[0]}${observer.lastName[0]}`"
              size="lg"
              color="primary"
              class="flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <h2
                class="text-xl sm:text-2xl font-bold text-gray-900 break-words"
              >
                {{ observer.firstName }} {{ observer.lastName }}
              </h2>
              <p class="text-xs sm:text-sm text-gray-500 mt-1">
                Tracking Number: {{ observer.trackingNumber || 'N/A' }}
              </p>
              <div class="mt-2 sm:mt-3">
                <Badge
                  :variant="getStatusBadgeVariant(observer.status)"
                  size="lg"
                >
                  {{ formatStatus(observer.status) }}
                </Badge>
              </div>
            </div>
          </div>
          <div class="flex w-full sm:w-auto">
            <Button
              variant="secondary"
              @click="goBack"
              class="w-full sm:w-auto"
            >
              <i class="icon-arrow-left mr-2"></i>
              <span class="hidden sm:inline">Back to Observers</span>
              <span class="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </div>

      <!-- Personal Information -->
      <div class="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Personal Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            label="National ID"
            :model-value="observer.nationalId"
            :is-edit-mode="false"
          />
          <FormField
            label="Email Address"
            :model-value="observer.email"
            :is-edit-mode="false"
          />
          <FormField
            label="Phone Number"
            :model-value="observer.phoneNumber"
            :is-edit-mode="false"
            empty-text="N/A"
          />
          <FormField
            label="Preferred County"
            :model-value="observer.preferredCounty?.name"
            :is-edit-mode="false"
            empty-text="N/A"
          />
        </div>
      </div>

      <!-- Registration Documents -->
      <div class="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Registration Documents
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <!-- Profile Photo -->
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-2">
              Profile Photo
            </label>
            <div
              v-if="observer.profilePhotoUrl"
              class="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                v-if="imageUrls.profile"
                :src="imageUrls.profile"
                :alt="`${observer.firstName} ${observer.lastName} profile photo`"
                class="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                @click="openImageModal(imageUrls.profile)"
              />
              <div v-else class="flex items-center justify-center h-48">
                <LoadingSpinner />
              </div>
            </div>
            <div
              v-else
              class="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg text-gray-400"
            >
              No photo uploaded
            </div>
          </div>

          <!-- National ID Front -->
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-2">
              National ID (Front)
            </label>
            <div
              v-if="observer.nationalIdFrontUrl"
              class="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                v-if="imageUrls.idFront"
                :src="imageUrls.idFront"
                alt="National ID Front"
                class="w-full h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity bg-white"
                @click="openImageModal(imageUrls.idFront)"
              />
              <div v-else class="flex items-center justify-center h-48">
                <LoadingSpinner />
              </div>
            </div>
            <div
              v-else
              class="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg text-gray-400"
            >
              No photo uploaded
            </div>
          </div>

          <!-- National ID Back -->
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-2">
              National ID (Back)
            </label>
            <div
              v-if="observer.nationalIdBackUrl"
              class="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                v-if="imageUrls.idBack"
                :src="imageUrls.idBack"
                alt="National ID Back"
                class="w-full h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity bg-white"
                @click="openImageModal(imageUrls.idBack)"
              />
              <div v-else class="flex items-center justify-center h-48">
                <LoadingSpinner />
              </div>
            </div>
            <div
              v-else
              class="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg text-gray-400"
            >
              No photo uploaded
            </div>
          </div>
        </div>
      </div>

      <!-- Registration Information -->
      <div class="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Registration Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            label="Registration Date"
            :model-value="formatDate(observer.createdAt)"
            :is-edit-mode="false"
          />
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-1">
              Status
            </label>
            <Badge :variant="getStatusBadgeVariant(observer.status)">
              {{ formatStatus(observer.status) }}
            </Badge>
          </div>
          <FormField
            label="Tracking Number"
            :model-value="observer.trackingNumber"
            :is-edit-mode="false"
            empty-text="N/A"
          />
          <FormField
            v-if="observer.reviewDate"
            label="Review Date"
            :model-value="formatDate(observer.reviewDate)"
            :is-edit-mode="false"
          />
        </div>
      </div>

      <!-- Review Notes -->
      <div
        v-if="observer.reviewNotes"
        class="bg-white shadow-sm rounded-lg p-4 sm:p-6"
      >
        <h3
          class="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4"
        >
          Review Notes
        </h3>
        <FormField
          label=""
          :model-value="observer.reviewNotes"
          :is-edit-mode="false"
          type="textarea"
          :rows="4"
        >
          <template #view="{ value }">
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ value }}</p>
          </template>
        </FormField>
      </div>

      <!-- Rejection Reason -->
      <div
        v-if="observer.rejectionReason"
        class="bg-white shadow-sm rounded-lg p-4 sm:p-6 border-l-4 border-red-500"
      >
        <h3
          class="text-base sm:text-lg font-semibold text-red-600 mb-3 sm:mb-4"
        >
          Rejection Reason
        </h3>
        <FormField
          label=""
          :model-value="observer.rejectionReason"
          :is-edit-mode="false"
          type="textarea"
          :rows="4"
        >
          <template #view="{ value }">
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ value }}</p>
          </template>
        </FormField>
      </div>
    </div>

    <!-- Image Modal -->
    <Modal v-model="imageModal.isOpen" title="View Image" size="lg">
      <img
        v-if="imageModal.imageUrl"
        :src="imageModal.imageUrl"
        :alt="imageModal.title"
        class="w-full max-h-[80vh] object-contain"
      />
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Avatar from '@/components/common/Avatar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import FormField from '@/components/common/FormField.vue';
import Modal from '@/components/common/Modal.vue';

const router = useRouter();
const route = useRoute();

interface Observer {
  id: string;
  nationalId: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  status: string;
  trackingNumber?: string;
  createdAt: string;
  reviewDate?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  preferredCounty?: { name: string };
  profilePhotoUrl?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
}

const loading = ref(false);
const error = ref<string | null>(null);
const observer = ref<Observer | null>(null);
const imageModal = ref<{ isOpen: boolean; imageUrl: string; title: string }>({
  isOpen: false,
  imageUrl: '',
  title: '',
});
const imageUrls = ref<Record<string, string>>({});

const loadObserver = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get(`/admin/observers/${route.params.id}`);
    observer.value = response.data.data;

    // Set image URLs directly from observer data (already presigned URLs from backend)
    if (observer.value) {
      if (observer.value.profilePhotoUrl) {
        imageUrls.value.profile = observer.value.profilePhotoUrl;
      }
      if (observer.value.nationalIdFrontUrl) {
        imageUrls.value.idFront = observer.value.nationalIdFrontUrl;
      }
      if (observer.value.nationalIdBackUrl) {
        imageUrls.value.idBack = observer.value.nationalIdBackUrl;
      }
    }
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Failed to load observer details';
    console.error('Error loading observer:', err);
  } finally {
    loading.value = false;
  }
};

const openImageModal = (imageUrl: string, title: string = '') => {
  imageModal.value = {
    isOpen: true,
    imageUrl,
    title,
  };
};

const goBack = () => {
  router.push('/admin/observers');
};

const getStatusBadgeVariant = (
  status: string
): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
  const variants: Record<
    string,
    'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  > = {
    pending_review: 'warning',
    approved: 'success',
    active: 'primary',
    rejected: 'danger',
    suspended: 'secondary',
    inactive: 'secondary',
  };
  return variants[status] || 'secondary';
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

onMounted(() => {
  loadObserver();
});
</script>
