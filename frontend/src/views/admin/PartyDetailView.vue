<template>
  <MainLayout
    :page-title="isEditMode ? 'Edit Party' : 'Party Details'"
    :page-description="party?.partyName || 'Loading...'"
  >
    <!-- Back Button -->
    <div class="mb-6">
      <Button variant="ghost" @click="goBack">
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Parties
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="xl" />
    </div>

    <!-- Error State -->
    <Alert
      v-else-if="error"
      variant="danger"
      :message="error"
      :show="!!error"
      dismissible
      @dismiss="error = ''"
    />

    <!-- Party Details -->
    <div v-else-if="party" class="space-y-6">
      <!-- Header Section -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-4">
            <!-- Party Logo (Both View and Edit Mode) -->
            <div class="relative">
              <div
                v-if="party.logoUrl"
                class="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 relative"
              >
                <img
                  :src="party.logoUrl"
                  :alt="party.partyName"
                  class="h-20 w-20 object-cover"
                />
                <!-- Upload overlay when uploading -->
                <div
                  v-if="uploadingLogo"
                  class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <LoadingSpinner size="md" class="text-white" />
                </div>
              </div>
              <div
                v-else
                class="min-w-20 h-20 rounded-lg flex items-center justify-center px-3 border-2 border-gray-200"
                :style="{
                  backgroundColor: (party.primaryColor || '#0047AB') + '20',
                }"
              >
                <span
                  class="text-lg font-bold text-center leading-tight break-words"
                  :style="{ color: party.primaryColor || '#0047AB' }"
                >
                  {{ party.abbreviation }}
                </span>
              </div>

              <!-- Upload Logo Button (Edit Mode Only) -->
              <div v-if="isEditMode" class="mt-2">
                <input
                  ref="logoInput"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  class="hidden"
                  @change="handleLogoSelect"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  @click="logoInput?.click()"
                  :loading="uploadingLogo"
                  :disabled="uploadingLogo"
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {{
                    uploadingLogo
                      ? 'Uploading...'
                      : party.logoUrl
                        ? 'Change Logo'
                        : 'Upload Logo'
                  }}
                </Button>
                <p class="text-xs text-gray-500 mt-1">
                  JPG, PNG or WebP (max 5MB)
                </p>
              </div>
            </div>

            <!-- Party Name & Status -->
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                {{ party.partyName }}
              </h2>
              <div class="flex items-center gap-3 mt-2">
                <Badge :variant="party.isActive ? 'success' : 'secondary'">
                  {{ party.isActive ? 'Active' : 'Inactive' }}
                </Badge>
                <span class="text-sm text-gray-600">
                  {{ party.abbreviation }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <template v-if="!isEditMode">
              <Button variant="primary" @click="toggleEditMode">
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Party
              </Button>
              <Button variant="danger" @click="confirmDelete">
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Party
              </Button>
            </template>
            <template v-else>
              <Button variant="secondary" @click="cancelEdit">Cancel</Button>
              <Button variant="primary" :loading="saving" @click="saveParty">
                Save Changes
              </Button>
            </template>
          </div>
        </div>
      </div>

      <!-- Party Information -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Basic Information -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>
          <div class="space-y-4">
            <FormField
              label="Party Name"
              :model-value="isEditMode ? formData.partyName : party.partyName"
              @update:model-value="formData.partyName = $event"
              :is-edit-mode="isEditMode"
              required
            />

            <FormField
              label="Abbreviation"
              :model-value="
                isEditMode ? formData.abbreviation : party.abbreviation
              "
              @update:model-value="formData.abbreviation = $event"
              :is-edit-mode="isEditMode"
            />

            <FormField
              label="Certificate Number"
              :model-value="party.certificateNumber"
              :is-edit-mode="false"
              value-class="font-mono"
            />

            <FormField
              label="Serial Number"
              :model-value="
                isEditMode ? formData.serialNumber : party.serialNumber
              "
              @update:model-value="formData.serialNumber = $event"
              :is-edit-mode="isEditMode"
            />

            <FormField
              label="Certificate Date"
              :model-value="
                isEditMode ? formData.certificateDate : party.certificateDate
              "
              @update:model-value="formData.certificateDate = $event"
              :is-edit-mode="isEditMode"
            />

            <!-- Affiliation -->
            <FormField
              label="Affiliation"
              :model-value="
                isEditMode ? formData.affiliation : party.affiliation
              "
              @update:model-value="formData.affiliation = $event"
              :is-edit-mode="isEditMode"
              type="select"
            >
              <template #options>
                <option value="">Not Set</option>
                <option value="main_party">Main Party</option>
                <option value="friendly_party">Friendly Party</option>
                <option value="competitor">Competitor</option>
              </template>
              <template #view>
                <Badge :variant="getAffiliationVariant(party.affiliation)">
                  {{ formatAffiliation(party.affiliation) }}
                </Badge>
              </template>
            </FormField>

            <!-- Status Toggle -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div v-if="isEditMode" class="flex items-center">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="formData.isActive"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                  ></div>
                  <span class="ml-3 text-sm font-medium text-gray-900">
                    {{ formData.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </label>
              </div>
              <Badge v-else :variant="party.isActive ? 'success' : 'secondary'">
                {{ party.isActive ? 'Active' : 'Inactive' }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Visual Identity -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Visual Identity
          </h3>
          <div class="space-y-4">
            <FormField
              label="Symbol"
              :model-value="isEditMode ? formData.symbol : party.symbol"
              @update:model-value="formData.symbol = $event"
              :is-edit-mode="isEditMode"
            />

            <FormField
              label="Colors"
              :model-value="isEditMode ? formData.colors : party.colors"
              @update:model-value="formData.colors = $event"
              :is-edit-mode="isEditMode"
            >
              <template #view>
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg border-2 border-gray-200"
                    :style="{
                      backgroundColor: party.primaryColor || '#0047AB',
                    }"
                  ></div>
                  <span class="text-gray-900">{{ party.colors || '—' }}</span>
                </div>
              </template>
            </FormField>

            <!-- Primary Color (Hex) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Primary Color (Hex)
              </label>
              <div v-if="isEditMode" class="flex gap-2">
                <input
                  v-model="formData.primaryColor"
                  type="color"
                  class="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  v-model="formData.primaryColor"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <p v-else class="text-gray-900 font-mono">
                {{ party.primaryColor || '—' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h3>
          <div class="space-y-4">
            <FormField
              label="Postal Address"
              :model-value="
                isEditMode ? formData.postalAddress : party.postalAddress
              "
              @update:model-value="formData.postalAddress = $event"
              :is-edit-mode="isEditMode"
              type="textarea"
              :rows="2"
            />

            <FormField
              label="Head Office Location"
              :model-value="
                isEditMode
                  ? formData.headOfficeLocation
                  : party.headOfficeLocation
              "
              @update:model-value="formData.headOfficeLocation = $event"
              :is-edit-mode="isEditMode"
              type="textarea"
              :rows="2"
            />
          </div>
        </div>

        <!-- Additional Information -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Additional Information
          </h3>
          <div class="space-y-4">
            <FormField
              label="Slogan"
              :model-value="isEditMode ? formData.slogan : party.slogan"
              @update:model-value="formData.slogan = $event"
              :is-edit-mode="isEditMode"
            />

            <FormField
              label="Changes/Notes"
              :model-value="isEditMode ? formData.changes : party.changes"
              @update:model-value="formData.changes = $event"
              :is-edit-mode="isEditMode"
              type="textarea"
              :rows="3"
            />

            <FormField
              label="Registered Candidates"
              :model-value="party.candidateCount || 0"
              :is-edit-mode="false"
              value-class="font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import FormField from '@/components/common/FormField.vue';
import api from '@/utils/api';

interface Party {
  id: string;
  serialNumber?: string;
  certificateNumber: string;
  partyName: string;
  abbreviation?: string;
  certificateDate?: string;
  symbol?: string;
  colors?: string;
  postalAddress?: string;
  headOfficeLocation?: string;
  slogan?: string;
  changes?: string;
  logoUrl?: string;
  primaryColor?: string;
  affiliation?: 'main_party' | 'friendly_party' | 'competitor';
  isActive: boolean;
  candidateCount?: number;
  createdAt: string;
  updatedAt: string;
}

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const saving = ref(false);
const uploadingLogo = ref(false);
const error = ref('');
const party = ref<Party | null>(null);
const isEditMode = ref(false);
const formData = ref<Partial<Party>>({});
const logoInput = ref<HTMLInputElement | null>(null);

const partyId = computed(() => route.params.id as string);

function toggleEditMode() {
  if (!isEditMode.value && party.value) {
    // Enter edit mode - copy only editable fields to form
    formData.value = {
      partyName: party.value.partyName,
      abbreviation: party.value.abbreviation,
      serialNumber: party.value.serialNumber,
      certificateDate: party.value.certificateDate,
      symbol: party.value.symbol,
      colors: party.value.colors,
      primaryColor: party.value.primaryColor,
      affiliation: party.value.affiliation,
      postalAddress: party.value.postalAddress,
      headOfficeLocation: party.value.headOfficeLocation,
      slogan: party.value.slogan,
      changes: party.value.changes,
      isActive: party.value.isActive,
    };
  }
  isEditMode.value = !isEditMode.value;
}

function cancelEdit() {
  isEditMode.value = false;
  formData.value = {};
}

async function loadParty() {
  try {
    loading.value = true;
    error.value = '';

    const response = await api.get(`/parties/${partyId.value}`);

    if (response.data.success) {
      party.value = response.data.data;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error loading party details';
    console.error('Load error:', err);
  } finally {
    loading.value = false;
  }
}

async function handleLogoSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    error.value =
      'Invalid file type. Only JPEG, PNG, and WebP images are allowed.';
    return;
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    error.value = 'File size exceeds 5MB limit.';
    return;
  }

  try {
    uploadingLogo.value = true;
    error.value = '';

    console.log('Uploading logo for party:', partyId.value);
    console.log('File:', file.name, file.type, file.size);

    const uploadFormData = new FormData();
    uploadFormData.append('logo', file);

    const response = await api.post(
      `/parties/${partyId.value}/logo`,
      uploadFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Upload response:', response.data);

    if (response.data.success) {
      // Reload party to get updated logo URL
      await loadParty();
      console.log('Party reloaded, new logoUrl:', party.value?.logoUrl);
    }
  } catch (err: any) {
    console.error('Upload error details:', err);
    console.error('Error response:', err.response?.data);
    error.value =
      err.response?.data?.message || err.message || 'Error uploading logo';
  } finally {
    uploadingLogo.value = false;
    // Reset file input
    if (logoInput.value) {
      logoInput.value.value = '';
    }
  }
}

async function saveParty() {
  try {
    saving.value = true;
    error.value = '';

    // Create a clean copy of formData, excluding read-only fields
    // Logo uploads are handled separately via the /logo endpoint
    const { logoUrl, candidateCount, createdAt, updatedAt, id, ...updateData } =
      formData.value;

    console.log('Saving party data:', updateData);

    const response = await api.put(`/parties/${partyId.value}`, updateData);

    if (response.data.success) {
      party.value = response.data.data;
      isEditMode.value = false;
      formData.value = {};
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error saving party';
    console.error('Save error:', err);
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!party.value) return;

  const confirmed = confirm(
    `Are you sure you want to delete "${party.value.partyName}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    loading.value = true;
    error.value = '';

    await api.delete(`/parties/${partyId.value}`);

    // Navigate back to parties list after successful deletion
    router.push('/admin/parties');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error deleting party';
    console.error('Delete error:', err);
    loading.value = false;
  }
}

function goBack() {
  router.push('/admin/parties');
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  console.error('Error loading image:', target.src);

  // If we're in edit mode and the image failed to load, reload the party
  // This might help if the presigned URL expired
  if (isEditMode.value) {
    console.log('Image load failed in edit mode, will reload on next view');
  }
}

function formatAffiliation(affiliation?: string | null): string {
  if (!affiliation) return 'Not Set';

  const affiliationMap: Record<string, string> = {
    main_party: 'Main Party',
    friendly_party: 'Friendly Party',
    competitor: 'Competitor',
  };

  return affiliationMap[affiliation] || affiliation;
}

function getAffiliationVariant(
  affiliation?: string | null
): 'primary' | 'success' | 'warning' | 'secondary' {
  if (!affiliation) return 'secondary';

  const variantMap: Record<
    string,
    'primary' | 'success' | 'warning' | 'secondary'
  > = {
    main_party: 'primary',
    friendly_party: 'success',
    competitor: 'warning',
  };

  return variantMap[affiliation] || 'secondary';
}

onMounted(() => {
  loadParty();
});
</script>
