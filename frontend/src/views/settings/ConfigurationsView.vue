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

      <!-- Configuration Categories Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="category in categories"
          :key="category.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
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
            <Badge :variant="category.status === 'active' ? 'success' : 'gray'">
              {{ category.status }}
            </Badge>
            <Button
              v-if="category.status === 'active'"
              variant="primary"
              size="sm"
              @click="viewConfiguration(category.id)"
            >
              View Settings
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Configuration Modal -->
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
import { useRouter } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
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

// State
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const router = useRouter();
const categories = ref<ConfigurationCategory[]>([]);
const showAddModal = ref(false);

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

const typeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
];

const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c.id, label: c.name }))
);

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

// Methods
async function loadCategories() {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get('/configurations');
    const configs = response.data.data;

    // Group by category and build categories array
    const categoryMap = new Map<string, number>();
    configs.forEach((config: any) => {
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

    // Sort by name for consistent display
    categories.value.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err: any) {
    console.error('Failed to load categories:', err);
    error.value = err.response?.data?.message || 'Failed to load categories';
  } finally {
    loading.value = false;
  }
}

function viewConfiguration(categoryId: string) {
  // Navigate to detailed view for this category
  router.push(`/settings/configurations/${categoryId}`);
}

async function saveConfiguration() {
  saving.value = true;
  error.value = null;

  try {
    const payload = {
      ...formData.value,
      value: formData.value.value,
    };

    await api.post('/configurations', payload);

    showAddModal.value = false;
    resetForm();
    await loadCategories();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save configuration';
  } finally {
    saving.value = false;
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
}

// Lifecycle
onMounted(async () => {
  await loadCategories();
});
</script>
