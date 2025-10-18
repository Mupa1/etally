<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            System Configurations
          </h1>
          <p class="text-sm sm:text-base text-gray-600 mt-1">
            Manage system-wide settings and configurations
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <Button variant="primary" @click="showAddModal = true">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Configuration
          </Button>
        </div>
      </div>

      <!-- Configuration Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="category in categories"
          :key="category.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          @click="selectCategory(category.id)"
          :class="{
            'ring-2 ring-primary-500': selectedCategory === category.id,
          }"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="p-2 rounded-lg" :class="`bg-${category.color}-100`">
                <component
                  :is="category.icon"
                  :class="`w-6 h-6 text-${category.color}-600`"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ category.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ category.description }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4">
            <span class="text-sm text-gray-500">
              {{ category.count }} settings
            </span>
            <Badge :variant="category.status === 'active' ? 'success' : 'gray'">
              {{ category.status }}
            </Badge>
          </div>
        </div>
      </div>

      <!-- Selected Category Settings -->
      <div
        v-if="selectedCategory"
        class="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ getCurrentCategory?.name }} Settings
            </h2>
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
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>

        <!-- Error State -->
        <Alert v-else-if="error" type="error" :message="error" class="m-6" />

        <!-- Settings List -->
        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="setting in currentSettings"
            :key="setting.id"
            class="p-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-base font-medium text-gray-900">
                    {{ setting.name }}
                  </h3>
                  <Badge v-if="setting.isRequired" variant="warning" size="sm">
                    Required
                  </Badge>
                </div>
                <p class="text-sm text-gray-500 mt-1">
                  {{ setting.description }}
                </p>
                <div class="mt-3 flex items-center space-x-4">
                  <span class="text-sm text-gray-700">
                    <strong>Key:</strong>
                    <code class="ml-1 px-2 py-1 bg-gray-100 rounded text-xs">
                      {{ setting.key }}
                    </code>
                  </span>
                  <span class="text-sm text-gray-700">
                    <strong>Type:</strong>
                    <Badge variant="gray" size="sm" class="ml-1">
                      {{ setting.type }}
                    </Badge>
                  </span>
                  <span
                    v-if="setting.lastModified"
                    class="text-sm text-gray-500"
                  >
                    Modified: {{ formatDate(setting.lastModified) }}
                  </span>
                </div>
              </div>
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
            <div
              v-if="setting.value !== null && setting.value !== undefined"
              class="mt-3 p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center justify-between">
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
              <div class="mt-2">
                <code
                  class="text-sm text-gray-900 break-all"
                  v-if="setting.type === 'json'"
                >
                  {{ formatJson(setting.value) }}
                </code>
                <span v-else class="text-sm text-gray-900">
                  {{ formatValue(setting.value, setting.type) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="currentSettings.length === 0" class="p-12 text-center">
            <EmptyState
              title="No settings found"
              description="No configurations available for this category"
              icon="document"
            />
          </div>
        </div>
      </div>

      <!-- No Category Selected -->
      <div
        v-else
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-12"
      >
        <EmptyState
          title="Select a category"
          description="Choose a configuration category above to view and manage settings"
          icon="folder"
        />
      </div>
    </div>

    <!-- Add/Edit Configuration Modal -->
    <Modal v-model="showAddModal" title="Add Configuration" size="lg">
      <form @submit.prevent="saveConfiguration" class="space-y-4">
        <Select
          v-model="formData.category"
          label="Category"
          placeholder="Select category"
          :options="categoryOptions"
          required
        />
        <FormField
          v-model="formData.key"
          label="Configuration Key"
          placeholder="e.g., max_upload_size"
          required
        />
        <FormField
          v-model="formData.name"
          label="Display Name"
          placeholder="e.g., Maximum Upload Size"
          required
        />
        <FormField
          v-model="formData.description"
          label="Description"
          placeholder="Describe what this configuration does"
          type="textarea"
          :rows="3"
        />
        <Select
          v-model="formData.type"
          label="Value Type"
          :options="typeOptions"
          required
        />
        <FormField
          v-if="formData.type === 'string' || formData.type === 'number'"
          v-model="formData.value"
          :label="`Value (${formData.type})`"
          :type="formData.type === 'number' ? 'number' : 'text'"
          placeholder="Enter value"
          required
        />
        <FormField
          v-else-if="formData.type === 'json'"
          v-model="formData.value"
          label="Value (JSON)"
          placeholder='{"key": "value"}'
          type="textarea"
          :rows="4"
        />
        <div v-else-if="formData.type === 'boolean'" class="flex items-center">
          <input
            type="checkbox"
            v-model="formData.value"
            id="boolValue"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="boolValue" class="ml-2 block text-sm text-gray-900">
            Enable
          </label>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="formData.isRequired"
            id="isRequired"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="isRequired" class="ml-2 block text-sm text-gray-900">
            Mark as required (cannot be deleted)
          </label>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            @click="showAddModal = false"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" :loading="saving">
            Save Configuration
          </Button>
        </div>
      </form>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Modal from '@/components/common/Modal.vue';
import FormField from '@/components/mobile/FormField.vue';
import Select from '@/components/common/Select.vue';
import { SettingsIcon } from '@/components/icons';
import api from '@/utils/api';

// Types
interface ConfigurationCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  count: number;
  status: 'active' | 'inactive';
}

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

// State
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const showAddModal = ref(false);
const selectedCategory = ref<string | null>(null);

// Category definitions with metadata
const categoryDefinitions: Record<
  string,
  Omit<ConfigurationCategory, 'id' | 'count'>
> = {
  general: {
    name: 'General',
    description: 'General system settings',
    icon: SettingsIcon,
    color: 'primary',
    status: 'active',
  },
  security: {
    name: 'Security',
    description: 'Security and authentication settings',
    icon: SettingsIcon,
    color: 'danger',
    status: 'active',
  },
  email: {
    name: 'Email Service',
    description: 'SMTP and email host configurations',
    icon: SettingsIcon,
    color: 'info',
    status: 'active',
  },
  notifications: {
    name: 'Notifications',
    description: 'Email and push notification settings',
    icon: SettingsIcon,
    color: 'success',
    status: 'active',
  },
  'rate-limiting': {
    name: 'Rate Limiting',
    description: 'API rate limiting configurations',
    icon: SettingsIcon,
    color: 'warning',
    status: 'active',
  },
  storage: {
    name: 'Storage',
    description: 'File storage and upload settings',
    icon: SettingsIcon,
    color: 'primary',
    status: 'active',
  },
  database: {
    name: 'Database',
    description: 'Database connection and performance',
    icon: SettingsIcon,
    color: 'gray',
    status: 'active',
  },
};

const categories = ref<ConfigurationCategory[]>([]);

const allSettings = ref<Configuration[]>([]);

// Form data
const formData = ref({
  category: '',
  key: '',
  name: '',
  description: '',
  value: '',
  type: 'string',
  isRequired: false,
});

const editingId = ref<string | null>(null);

// Computed
const getCurrentCategory = computed(() =>
  categories.value.find((c) => c.id === selectedCategory.value)
);

const currentSettings = computed(() =>
  allSettings.value.filter((s) => s.category === selectedCategory.value)
);

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c.id, label: c.name }))
);

const typeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
];

// Methods
async function loadCategories() {
  try {
    const response = await api.get('/configurations');
    const configs = response.data.data;

    // Group by category and build categories array
    const categoryMap = new Map<string, number>();
    configs.forEach((config: Configuration) => {
      const count = categoryMap.get(config.category) || 0;
      categoryMap.set(config.category, count + 1);
    });

    categories.value = Array.from(categoryMap.entries()).map(([id, count]) => ({
      id,
      count,
      ...(categoryDefinitions[id] || {
        name: id,
        description: `${id} configurations`,
        icon: SettingsIcon,
        color: 'gray',
        status: 'active',
      }),
    }));

    // Store all settings
    allSettings.value = configs;
  } catch (err: any) {
    console.error('Failed to load categories:', err);
    error.value = err.response?.data?.message || 'Failed to load categories';
  }
}

function selectCategory(categoryId: string) {
  selectedCategory.value = categoryId;
  loadSettings();
}

async function loadSettings() {
  if (!selectedCategory.value) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await api.get(
      `/configurations/category/${selectedCategory.value}`
    );

    // Update the settings for this category
    const categorySettings = response.data.data;
    allSettings.value = [
      ...allSettings.value.filter(
        (s: Configuration) => s.category !== selectedCategory.value
      ),
      ...categorySettings,
    ];
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Failed to load configurations';
  } finally {
    loading.value = false;
  }
}

async function refreshSettings() {
  await loadCategories();
  if (selectedCategory.value) {
    await loadSettings();
  }
}

function editSetting(setting: Configuration) {
  formData.value = {
    category: setting.category,
    key: setting.key,
    name: setting.name,
    description: setting.description || '',
    value: formatValueForEdit(setting.value, setting.type),
    type: setting.type,
    isRequired: setting.isRequired,
  };
  editingId.value = setting.id;
  showAddModal.value = true;
}

function formatValueForEdit(value: any, type: string): string {
  if (value === null || value === undefined) return '';
  if (type === 'json') return JSON.stringify(value, null, 2);
  if (type === 'boolean') return value;
  return String(value);
}

async function saveConfiguration() {
  saving.value = true;
  error.value = null;

  try {
    const payload = {
      ...formData.value,
      value: formData.value.value,
    };

    if (editingId.value) {
      // Update existing
      await api.put(`/configurations/${editingId.value}`, payload);
    } else {
      // Create new
      await api.post('/configurations', payload);
    }

    showAddModal.value = false;
    resetForm();
    await refreshSettings();
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
    await refreshSettings();
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Failed to delete configuration';
  }
}

function resetForm() {
  formData.value = {
    category: '',
    key: '',
    name: '',
    description: '',
    value: '',
    type: 'string',
    isRequired: false,
  };
  editingId.value = null;
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Lifecycle
onMounted(async () => {
  await loadCategories();

  // Auto-select first category
  if (categories.value.length > 0) {
    selectCategory(categories.value[0].id);
  }
});
</script>
