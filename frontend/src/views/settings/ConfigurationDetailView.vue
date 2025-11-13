<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <button
            @click="goBack"
            class="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
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
            Back to Configurations
          </button>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            {{ categoryName }} Settings
          </h1>
          <p class="text-sm sm:text-base text-gray-600 mt-1">
            {{ categoryDescription }}
          </p>
        </div>
        <Button variant="secondary" size="sm" @click="refreshSettings">
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error State -->
      <Alert v-else-if="error" type="error" :message="error" />

      <!-- Settings List -->
      <div v-else class="space-y-4">
        <SmsServiceConfigCard
          v-if="isSmsCategory"
          :settings="settings"
          @updated="loadSettings"
        />
        <SmsServiceTestCard v-if="isSmsCategory" />
        <div
          v-for="setting in remainingSettings"
          :key="setting.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ setting.name }}
                </h3>
                <Badge v-if="setting.isRequired" variant="warning" size="sm">
                  Required
                </Badge>
                <Badge variant="gray" size="sm">
                  {{ setting.type }}
                </Badge>
              </div>
              <p class="text-sm text-gray-500 mb-4">
                {{ setting.description }}
              </p>

              <!-- Current Value Display -->
              <div
                v-if="setting.value !== null && setting.value !== undefined"
                class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">
                    Current Value:
                  </span>
                  <Badge
                    :variant="setting.isDefault ? 'gray' : 'primary'"
                    size="sm"
                  >
                    {{ setting.isDefault ? 'Default' : 'Custom' }}
                  </Badge>
                </div>
                <div class="mt-2 flex items-center space-x-2">
                  <code
                    class="text-sm text-gray-900 break-all flex-1"
                    v-if="setting.type === 'json'"
                  >
                    {{ formatJson(setting.value) }}
                  </code>
                  <span v-else class="text-sm font-medium text-gray-900 flex-1">
                    <span v-if="isPasswordField(setting.key) && !showPassword">
                      ●●●●●●●●●●●●●●●
                    </span>
                    <span v-else>
                      {{ formatValue(setting.value, setting.type) }}
                    </span>
                  </span>
                  <button
                    v-if="isPasswordField(setting.key)"
                    type="button"
                    @click="showPassword = !showPassword"
                    class="text-gray-600 hover:text-gray-900 p-1"
                    :title="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <svg
                      v-if="showPassword"
                      class="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
              </div>

              <!-- Configuration Key -->
              <div class="mt-4 flex items-center space-x-2">
                <span class="text-xs text-gray-500">Key:</span>
                <code
                  class="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700"
                >
                  {{ setting.key }}
                </code>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center space-x-2 ml-4">
              <Button
                variant="secondary"
                size="sm"
                @click="editSetting(setting)"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </Button>
              <Button
                v-if="!setting.isRequired"
                variant="danger"
                size="sm"
                @click="deleteSetting(setting)"
              >
                <svg
                  class="w-4 h-4"
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
              </Button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="!isSmsCategory && remainingSettings.length === 0"
          class="p-12 text-center"
        >
          <EmptyState
            title="No settings found"
            description="No configurations available for this category"
            icon="document"
          />
        </div>
      </div>
    </div>

    <!-- Edit Configuration Modal -->
    <Modal v-model="showEditModal" title="Edit Configuration" size="lg">
      <form
        @submit.prevent="saveConfiguration"
        class="space-y-4"
        v-if="editingSetting"
      >
        <FormField :modelValue="editingSetting.name" label="Name" disabled />
        <FormField :modelValue="editingSetting.key" label="Key" disabled />
        <FormField
          :modelValue="editingSetting.description"
          label="Description"
          type="textarea"
          :rows="2"
          disabled
        />

        <!-- Value Input based on type -->
        <div
          v-if="
            editingSetting.type === 'string' || editingSetting.type === 'number'
          "
        >
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Value ({{ editingSetting.type }})
          </label>
          <div class="relative">
            <input
              v-model="formData.value"
              :type="
                isPasswordField(editingSetting.key) && !showPassword
                  ? 'password'
                  : editingSetting.type === 'number'
                    ? 'number'
                    : 'text'
              "
              :placeholder="'Enter value'"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :class="{
                'pr-10': isPasswordField(editingSetting.key),
              }"
              required
            />
            <button
              v-if="isPasswordField(editingSetting.key)"
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-900"
            >
              <svg
                v-if="showPassword"
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        </div>
        <FormField
          v-else-if="editingSetting.type === 'json'"
          v-model="formData.value"
          label="Value (JSON)"
          placeholder='{"key": "value"}'
          type="textarea"
          :rows="6"
          required
        />
        <div
          v-else-if="editingSetting.type === 'boolean'"
          class="flex items-center"
        >
          <input
            type="checkbox"
            v-model="formData.value"
            id="boolValue"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="boolValue" class="ml-2 block text-sm text-gray-900">
            {{ formData.value ? 'Enabled' : 'Disabled' }}
          </label>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            @click="showEditModal = false"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" :loading="saving">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Modal from '@/components/common/Modal.vue';
import FormField from '@/components/mobile/FormField.vue';
import SmsServiceConfigCard from '@/components/settings/SmsServiceConfigCard.vue';
import SmsServiceTestCard from '@/components/settings/SmsServiceTestCard.vue';
import api from '@/utils/api';

interface Configuration {
  id: string;
  key: string;
  name: string;
  description: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  isRequired: boolean;
  isDefault: boolean;
  lastModified?: Date;
}

const router = useRouter();
const route = useRoute();
const categoryId = computed(() => route.params.id as string);

const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const settings = ref<Configuration[]>([]);
const showEditModal = ref(false);
const editingSetting = ref<Configuration | null>(null);
const formData = ref({ value: '' });
const showPassword = ref(false);

const categoryNames: Record<string, { name: string; description: string }> = {
  general: {
    name: 'General',
    description: 'General system settings and application configuration',
  },
  security: {
    name: 'Security',
    description: 'Security and authentication settings',
  },
  email: {
    name: 'Email Service',
    description: 'Legacy email host configurations (currently disabled)',
  },
  sms: {
    name: 'SMS Service',
    description: 'SMS provider configuration',
  },
  notifications: {
    name: 'Notifications',
    description: 'Email and push notification settings',
  },
  'rate-limiting': {
    name: 'Rate Limiting',
    description: 'API rate limiting configurations',
  },
  storage: {
    name: 'Storage',
    description: 'File storage and upload settings',
  },
  database: {
    name: 'Database',
    description: 'Database connection and performance settings',
  },
};

const categoryName = computed(() => {
  return categoryNames[categoryId.value]?.name || categoryId.value;
});

const categoryDescription = computed(() => {
  return (
    categoryNames[categoryId.value]?.description ||
    'System configuration settings'
  );
});

const smsCategoryTokens = ['sms', 'text', 'jambo', 'mobile'];

const smsConfigKeys = new Set([
  'sms_provider',
  'jambo_api_key',
  'jambo_partner_id',
  'jambo_shortcode',
  'jambo_base_url',
  'sms_max_retry',
  'sms_timeout',
]);

const isSmsCategory = computed(() => {
  const rawId = (categoryId.value ?? '').toString();
  const normalizedId = rawId.trim().toLowerCase().replace(/[\s_-]+/g, '');

  if (smsCategoryTokens.some((token) => normalizedId.includes(token))) {
    return true;
  }

  return settings.value.some((setting) =>
    smsConfigKeys.has(setting.key.toLowerCase())
  );
});

const remainingSettings = computed(() => {
  if (!isSmsCategory.value) {
    return settings.value;
  }

  return settings.value.filter(
    (setting) => !smsConfigKeys.has(setting.key.toLowerCase())
  );
});

async function loadSettings() {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get(
      `/configurations/category/${categoryId.value}`
    );
    settings.value = response.data.data;
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Failed to load configurations';
  } finally {
    loading.value = false;
  }
}

async function refreshSettings() {
  await loadSettings();
}

function editSetting(setting: Configuration) {
  editingSetting.value = setting;
  formData.value.value = formatValueForEdit(setting.value, setting.type);
  showEditModal.value = true;
}

function formatValueForEdit(value: any, type: string): string {
  if (value === null || value === undefined) return '';
  if (type === 'json') return JSON.stringify(value, null, 2);
  if (type === 'boolean') return String(value);
  return String(value);
}

async function saveConfiguration() {
  if (!editingSetting.value) return;

  saving.value = true;
  error.value = null;

  try {
    let value: any = formData.value.value;

    // Parse value based on type
    if (editingSetting.value.type === 'number') {
      value = Number(value);
    } else if (editingSetting.value.type === 'boolean') {
      value = value === 'true' || value === true;
    } else if (editingSetting.value.type === 'json') {
      value = JSON.parse(value);
    }

    await api.put(`/configurations/${editingSetting.value.id}`, {
      ...editingSetting.value,
      value,
    });

    showEditModal.value = false;
    editingSetting.value = null;
    await loadSettings();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save configuration';
  } finally {
    saving.value = false;
  }
}

async function deleteSetting(setting: Configuration) {
  if (
    !confirm(
      `Are you sure you want to delete the configuration "${setting.name}"?`
    )
  ) {
    return;
  }

  try {
    await api.delete(`/configurations/${setting.id}`);
    await loadSettings();
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Failed to delete configuration';
  }
}

function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'boolean':
      return value ? 'Enabled' : 'Disabled';
    case 'number':
      return value.toLocaleString();
    case 'json':
      return JSON.stringify(value, null, 2);
    default:
      return String(value);
  }
}

function formatJson(value: any): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isPasswordField(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.includes('password') || lower.includes('api_key');
}

function goBack() {
  router.push('/settings/configurations');
}

onMounted(async () => {
  await loadSettings();
});
</script>
