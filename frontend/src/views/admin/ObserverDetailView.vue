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
              <div class="flex items-center gap-2 flex-wrap">
                <h2
                  class="text-xl sm:text-2xl font-bold text-gray-900 break-words"
                >
                  {{ observer.firstName }} {{ observer.lastName }}
                </h2>
                <Badge
                  v-if="observer.isTrusted"
                  variant="success"
                  size="sm"
                  class="hidden sm:inline-flex"
                >
                  <i class="icon-star mr-1"></i>
                  Trusted
                </Badge>
              </div>
              <p class="text-xs sm:text-sm text-gray-500 mt-1">
                Tracking Number: {{ observer.trackingNumber || 'N/A' }}
              </p>
              <div class="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  :variant="getStatusBadgeVariant(observer.status)"
                  size="lg"
                >
                  {{ formatStatus(observer.status) }}
                </Badge>
                <Badge
                  v-if="observer.isTrusted"
                  variant="success"
                  size="sm"
                  class="sm:hidden"
                >
                  <i class="icon-star mr-1"></i>
                  Trusted
                </Badge>
              </div>
            </div>
          </div>
          <div class="flex w-full sm:w-auto gap-2">
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

      <!-- Action Buttons -->
      <div class="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Actions
        </h3>
        <div class="flex flex-wrap gap-2 sm:gap-3">
          <Button
            v-if="canApprove"
            variant="success"
            @click="handleApprove"
            :disabled="actionLoading"
          >
            <i class="icon-check mr-2"></i>
            Approve
          </Button>
          <Button
            v-if="canRequestInfo"
            variant="warning"
            @click="showRequestInfoModal = true"
            :disabled="actionLoading"
          >
            <i class="icon-info mr-2"></i>
            Request More Info
          </Button>
          <Button
            v-if="canReject"
            variant="danger"
            @click="showRejectModal = true"
            :disabled="actionLoading"
          >
            <i class="icon-x mr-2"></i>
            Reject
          </Button>
          <Button
            v-if="canBlacklist"
            variant="danger"
            @click="handleBlacklist"
            :disabled="actionLoading"
          >
            <i class="icon-ban mr-2"></i>
            Blacklist
          </Button>
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

      <!-- Observer History -->
      <div class="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Observer History
        </h3>
        <div v-if="historyLoading" class="flex justify-center py-8">
          <LoadingSpinner />
        </div>
        <div v-else-if="history.length === 0" class="text-center py-8">
          <p class="text-gray-500">No history available</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="flex gap-4 pb-4 border-b border-gray-200 last:border-0"
          >
            <div class="flex-shrink-0">
              <div
                class="w-2 h-2 rounded-full mt-2"
                :class="getHistoryItemColor(item.action)"
              ></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ item.title }}
                  </p>
                  <p v-if="item.description" class="text-sm text-gray-600 mt-1">
                    {{ item.description }}
                  </p>
                </div>
                <p class="text-xs text-gray-500 whitespace-nowrap">
                  {{ formatDateTime(item.date) }}
                </p>
              </div>
              <p v-if="item.performedBy" class="text-xs text-gray-500 mt-1">
                by {{ item.performedBy }}
              </p>
            </div>
          </div>
        </div>
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

    <!-- Request More Info Modal -->
    <Modal
      v-model="showRequestInfoModal"
      title="Request More Information"
      size="md"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Please specify what additional information you need from the observer.
        </p>
        <FormField
          label="Message"
          v-model="requestInfoData.notes"
          :is-edit-mode="true"
          type="textarea"
          :rows="5"
          placeholder="Enter the information you need from the observer..."
        />
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button variant="secondary" @click="showRequestInfoModal = false">
            Cancel
          </Button>
          <Button
            variant="primary"
            @click="handleRequestInfo"
            :disabled="!requestInfoData.notes.trim() || actionLoading"
          >
            Send Request
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Reject Modal -->
    <Modal v-model="showRejectModal" title="Reject Observer" size="md">
      <div class="space-y-4">
        <Alert
          type="warning"
          message="Are you sure you want to reject this observer? This action cannot be undone."
        />
        <FormField
          label="Rejection Reason"
          v-model="rejectData.rejectionReason"
          :is-edit-mode="true"
          type="textarea"
          :rows="5"
          placeholder="Please provide a reason for rejection (required)"
          required
        />
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button variant="secondary" @click="showRejectModal = false">
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="handleReject"
            :disabled="!rejectData.rejectionReason.trim() || actionLoading"
          >
            Reject Observer
          </Button>
        </div>
      </template>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Avatar from '@/components/common/Avatar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import { useToast } from '@/composables/useToast';
import FormField from '@/components/common/FormField.vue';
import Modal from '@/components/common/Modal.vue';

const router = useRouter();
const route = useRoute();
const toast = useToast();

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
  updatedAt?: string;
  reviewDate?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  preferredCounty?: { name: string };
  profilePhotoUrl?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
  isTrusted?: boolean;
}

interface HistoryItem {
  date: string;
  action: string;
  title: string;
  description?: string;
  performedBy?: string;
}

const loading = ref(false);
const historyLoading = ref(false);
const actionLoading = ref(false);
const error = ref<string | null>(null);
const observer = ref<Observer | null>(null);
const history = ref<HistoryItem[]>([]);
const imageModal = ref<{ isOpen: boolean; imageUrl: string; title: string }>({
  isOpen: false,
  imageUrl: '',
  title: '',
});
const imageUrls = ref<Record<string, string>>({});

// Modal states
const showRequestInfoModal = ref(false);
const showRejectModal = ref(false);

// Form data
const requestInfoData = ref({
  notes: '',
});

const rejectData = ref({
  rejectionReason: '',
});

// Computed properties for button visibility
const canApprove = computed(() => {
  return ['pending_review', 'more_information_requested'].includes(observer.value?.status || '');
});

const canRequestInfo = computed(() => {
  return ['pending_review', 'more_information_requested'].includes(observer.value?.status || '');
});

const canReject = computed(() => {
  return ['pending_review', 'more_information_requested', 'approved'].includes(observer.value?.status || '');
});

const canBlacklist = computed(() => {
  const status = observer.value?.status || '';
  return !['rejected', 'suspended'].includes(status);
});

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

    // Load history
    await loadHistory();
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Failed to load observer details';
    console.error('Error loading observer:', err);
  } finally {
    loading.value = false;
  }
};

const loadHistory = async () => {
  if (!observer.value) return;

  historyLoading.value = true;
  try {
    // For now, we'll build history from observer data
    // TODO: Replace with actual history API endpoint when available
    const historyItems: HistoryItem[] = [];

    // Registration
    historyItems.push({
      date: observer.value.createdAt,
      action: 'registration',
      title: 'Observer Registration',
      description: 'Observer registered in the system',
    });

    // Review date if exists
    if (observer.value.reviewDate) {
      let action = 'review';
      let title = 'Application Reviewed';
      
      if (observer.value.status === 'rejected') {
        action = 'rejection';
        title = 'Application Rejected';
      } else if (observer.value.status === 'more_information_requested') {
        action = 'request_info';
        title = 'More Information Requested';
      } else if (observer.value.status === 'approved') {
        action = 'approval';
        title = 'Application Approved';
      }

      historyItems.push({
        date: observer.value.reviewDate,
        action,
        title,
        description: observer.value.reviewNotes || '',
      });
    }

    // Status changes (only if not already added in review section)
    if (observer.value.status === 'approved' && !observer.value.reviewDate) {
      historyItems.push({
        date: observer.value.createdAt,
        action: 'approval',
        title: 'Application Approved',
        description: 'Observer application has been approved',
      });
    }

    if (observer.value.status === 'active') {
      historyItems.push({
        date: observer.value.updatedAt || observer.value.reviewDate || observer.value.createdAt,
        action: 'activation',
        title: 'Observer Activated',
        description: 'Observer account is now active',
      });
    }

    // Sort by date (most recent first)
    history.value = historyItems.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (err: any) {
    console.error('Error loading history:', err);
  } finally {
    historyLoading.value = false;
  }
};

const handleApprove = async () => {
  if (!observer.value) return;

  if (
    !confirm(
      'Are you sure you want to approve this observer? They will receive an email to set up their password.'
    )
  ) {
    return;
  }

  actionLoading.value = true;
  error.value = null;

  try {
    await api.put(`/admin/observers/${observer.value.id}`, {
      status: 'approved',
      reviewNotes: 'Application approved by admin',
    });

    await loadObserver();
    toast.success('Observer approved successfully');
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.message || 'Failed to approve observer';
    error.value = errorMessage;
    toast.error(errorMessage);
    console.error('Error approving observer:', err);
  } finally {
    actionLoading.value = false;
  }
};

const handleRequestInfo = async () => {
  if (!observer.value || !requestInfoData.value.notes.trim()) return;

  actionLoading.value = true;
  error.value = null;

  try {
    await api.put(`/admin/observers/${observer.value.id}`, {
      status: 'more_information_requested',
      reviewNotes: `Information requested: ${requestInfoData.value.notes}`,
    });

    showRequestInfoModal.value = false;
    requestInfoData.value.notes = '';
    await loadObserver();
    toast.success('Information request sent successfully');
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.message || 'Failed to send information request';
    error.value = errorMessage;
    toast.error(errorMessage);
    console.error('Error requesting information:', err);
  } finally {
    actionLoading.value = false;
  }
};

const handleReject = async () => {
  if (!observer.value || !rejectData.value.rejectionReason.trim()) return;

  actionLoading.value = true;
  error.value = null;

  try {
    await api.put(`/admin/observers/${observer.value.id}`, {
      status: 'rejected',
      rejectionReason: rejectData.value.rejectionReason,
      reviewNotes: `Application rejected: ${rejectData.value.rejectionReason}`,
    });

    showRejectModal.value = false;
    rejectData.value.rejectionReason = '';
    await loadObserver();
    toast.success('Observer rejected successfully');
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.message || 'Failed to reject observer';
    error.value = errorMessage;
    toast.error(errorMessage);
    console.error('Error rejecting observer:', err);
  } finally {
    actionLoading.value = false;
  }
};

const handleBlacklist = async () => {
  if (!observer.value) return;

  if (
    !confirm(
      'Are you sure you want to blacklist this observer? This will permanently mark them as ineligible.'
    )
  ) {
    return;
  }

  actionLoading.value = true;
  error.value = null;

  try {
    await api.put(`/admin/observers/${observer.value.id}`, {
      status: 'suspended',
      reviewNotes: 'Observer blacklisted by admin',
    });

    await loadObserver();
    toast.success('Observer blacklisted successfully');
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.message || 'Failed to blacklist observer';
    error.value = errorMessage;
    toast.error(errorMessage);
    console.error('Error blacklisting observer:', err);
  } finally {
    actionLoading.value = false;
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
    more_information_requested: 'warning',
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

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getHistoryItemColor = (action: string) => {
  const colors: Record<string, string> = {
    registration: 'bg-blue-500',
    approval: 'bg-green-500',
    activation: 'bg-primary-500',
    rejection: 'bg-red-500',
    review: 'bg-yellow-500',
    request_info: 'bg-orange-500',
    blacklist: 'bg-gray-700',
  };
  return colors[action] || 'bg-gray-400';
};

onMounted(() => {
  loadObserver();
});
</script>
