<template>
  <MainLayout>
    <div class="space-y-6">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            SMS Templates
          </h1>
          <p class="text-sm sm:text-base text-gray-600 mt-1">
            Manage SMS templates for system notifications
          </p>
        </div>
        <Button variant="primary" @click="showCreateModal = true">
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
          Create Template
        </Button>
      </div>

      <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div class="space-y-4 md:space-y-0">
          <div class="w-full">
            <SearchBar
              v-model="searchQuery"
              placeholder="Search templates by name, message, or type..."
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Select
              v-model="typeFilter"
              label="Template Type"
              placeholder="All Types"
              :options="typeOptions"
            />
            <Select
              v-model="statusFilter"
              label="Status"
              placeholder="All Status"
              :options="statusOptions"
            />
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              @click="resetFilters"
              class="w-full sm:w-auto"
            >
              Reset Filters
            </Button>
            <Button
              variant="primary"
              @click="loadTemplates"
              class="w-full sm:w-auto"
              :disabled="loading"
            >
              <svg
                class="w-4 h-4 mr-2"
                :class="{ 'animate-spin': loading }"
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
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <Alert v-else-if="error" type="error" :message="error" class="mb-4" />

      <EmptyState
        v-else-if="filteredTemplates.length === 0"
        title="No SMS templates"
        description="No templates match your search criteria"
      >
        <Button variant="primary" @click="showCreateModal = true">
          Create Template
        </Button>
      </EmptyState>

      <Table
        v-else
        :columns="tableColumns"
        :data="filteredTemplates"
        :current-page="currentPage"
        :per-page="perPage"
        @page-change="currentPage = $event"
        @per-page-change="handlePerPageChange"
      >
        <template #cell-template="{ item }">
          <div class="flex items-start py-2">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
              :class="getTemplateTypeColor(item.templateType)"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div class="ml-3 min-w-0 flex-1">
              <div class="text-sm font-medium text-gray-900">
                {{ item.name }}
              </div>
              <div class="text-xs sm:text-sm text-gray-500 mt-0.5">
                {{ item.description || 'No description' }}
              </div>
              <div class="sm:hidden mt-2 space-y-1">
                <div class="text-xs text-gray-600 line-clamp-2">
                  {{ item.body }}
                </div>
                <div class="flex gap-1">
                  <Badge
                    :variant="getStatusBadgeVariant(item.isActive)"
                    size="sm"
                  >
                    {{ item.isActive ? 'Active' : 'Inactive' }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #cell-type="{ item }">
          <span class="text-sm text-gray-900">{{
            formatType(item.templateType)
          }}</span>
        </template>
        <template #cell-message="{ item }">
          <span class="text-sm text-gray-900 line-clamp-2">
            {{ item.body }}
          </span>
        </template>
        <template #cell-status="{ item }">
          <Badge :variant="getStatusBadgeVariant(item.isActive)">
            {{ item.isActive ? 'Active' : 'Inactive' }}
          </Badge>
        </template>
        <template #cell-updated="{ item }">
          <span class="text-sm text-gray-500">
            {{ formatDate(item.updatedAt) }}
          </span>
        </template>
        <template #cell-actions="{ item }">
          <Dropdown
            button-label="Actions"
            button-class="px-3 py-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
          >
            <DropdownItem @click="editTemplate(item)">
              Edit Template
            </DropdownItem>
            <DropdownItem @click="previewTemplate(item)">
              Preview
            </DropdownItem>
            <DropdownItem
              @click="toggleTemplateStatus(item)"
              :variant="item.isActive ? 'warning' : 'success'"
            >
              {{ item.isActive ? 'Deactivate' : 'Activate' }}
            </DropdownItem>
            <DropdownItem @click="deleteTemplate(item)" variant="danger">
              Delete
            </DropdownItem>
          </Dropdown>
        </template>
      </Table>
    </div>

    <!-- Create Template Modal -->
    <Modal
      v-model="showCreateModal"
      title="Create SMS Template"
      size="lg"
      @close="closeModal"
    >
      <div class="space-y-4">
        <FormField label="Template Name" required>
          <input
            v-model="formData.name"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Registration Confirmation SMS"
          />
        </FormField>

        <FormField label="Template Type" required>
          <Select
            v-model="formData.templateType"
            placeholder="Select type"
            :options="templateTypeOptions"
          />
        </FormField>

        <FormField
          label="Message Body"
          required
          description="Use {{variable}} syntax for dynamic placeholders"
        >
          <textarea
            v-model="formData.body"
            rows="5"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Hello {{firstName}}, your account is ready..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            {{ formData.body.length }} characters
          </p>
        </FormField>

        <FormField label="Description">
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Short description of when this template is used"
          ></textarea>
        </FormField>

        <label class="inline-flex items-center space-x-2">
          <input
            v-model="formData.isActive"
            type="checkbox"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span class="text-sm text-gray-700">Template is active</span>
        </label>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="closeModal">Cancel</Button>
          <Button variant="primary" :loading="saving" @click="saveTemplate">
            Save Template
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Preview Modal -->
    <Modal
      v-model="showPreviewModal"
      title="SMS Preview"
      size="md"
      @close="showPreviewModal = false"
    >
      <div class="space-y-3">
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p class="text-sm text-gray-900 whitespace-pre-line">
            {{ previewMessage }}
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <Button variant="primary" @click="showPreviewModal = false">
            Close
          </Button>
        </div>
      </template>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import DropdownItem from '@/components/common/DropdownItem.vue';
import FormField from '@/components/common/FormField.vue';
import Select from '@/components/common/Select.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import Table from '@/components/common/Table.vue';
import Modal from '@/components/common/Modal.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import api from '@/utils/api';
import type { TableColumn } from '@/components/common/Table.vue';

interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  description?: string;
  templateType: string;
  variables?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const templates = ref<SmsTemplate[]>([]);
const showCreateModal = ref(false);
const showPreviewModal = ref(false);
const previewMessage = ref('');
const searchQuery = ref('');
const typeFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const perPage = ref(10);

const formData = ref({
  name: '',
  body: '',
  description: '',
  templateType: '',
  isActive: true,
});

const templateTypeOptions = [
  { label: 'Registration Confirmation', value: 'registration_confirmation' },
  { label: 'Password Setup', value: 'password_setup' },
  { label: 'Welcome', value: 'welcome' },
  { label: 'Rejection', value: 'rejection' },
  { label: 'Clarification Request', value: 'clarification_request' },
  { label: 'Election Update', value: 'election_update' },
  { label: 'General Notification', value: 'general_notification' },
];

const tableColumns: TableColumn[] = [
  { key: 'template', label: 'Template', sortable: false },
  { key: 'type', label: 'Type', sortable: false },
  { key: 'message', label: 'Message', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'updated', label: 'Last Updated', sortable: false },
  { key: 'actions', label: 'Actions', sortable: false },
];

const typeOptions = computed(() => [
  { label: 'All Types', value: '' },
  ...templateTypeOptions,
]);

const statusOptions = computed(() => [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]);

const filteredTemplates = computed(() => {
  let filtered = templates.value;
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.body.toLowerCase().includes(query) ||
        template.templateType.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
    );
  }

  if (typeFilter.value) {
    filtered = filtered.filter(
      (template) => template.templateType === typeFilter.value
    );
  }

  if (statusFilter.value) {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter((template) => template.isActive === isActive);
  }

  return filtered;
});

async function loadTemplates() {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get('/communication/sms-templates');
    templates.value = response.data.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load templates';
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  searchQuery.value = '';
  typeFilter.value = '';
  statusFilter.value = '';
}

async function saveTemplate() {
  if (!formData.value.templateType) {
    error.value = 'Template type is required';
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await api.post('/communication/sms-templates', formData.value);
    closeModal();
    await loadTemplates();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create template';
  } finally {
    saving.value = false;
  }
}

function closeModal() {
  showCreateModal.value = false;
  formData.value = {
    name: '',
    body: '',
    description: '',
    templateType: '',
    isActive: true,
  };
}

function editTemplate(template: SmsTemplate) {
  router.push(`/communication/sms-templates/${template.id}/edit`);
}

async function previewTemplate(template: SmsTemplate) {
  const sampleVariables = {
    firstName: 'John',
    lastName: 'Doe',
    trackingNumber: 'OBS-2025-001234',
    electionCode: 'BY-ELECTIONS-2025-01',
  };

  try {
    const response = await api.post('/communication/sms-templates/render', {
      templateType: template.templateType,
      variables: sampleVariables,
    });
    previewMessage.value = response.data.data.body;
    showPreviewModal.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to preview template';
  }
}

async function toggleTemplateStatus(template: SmsTemplate) {
  try {
    await api.put(`/communication/sms-templates/${template.id}`, {
      isActive: !template.isActive,
    });
    await loadTemplates();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update template';
  }
}

async function deleteTemplate(template: SmsTemplate) {
  if (
    !confirm(
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    await api.delete(`/communication/sms-templates/${template.id}`);
    await loadTemplates();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete template';
  }
}

function handlePerPageChange(value: number) {
  perPage.value = value;
  currentPage.value = 1;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusBadgeVariant(isActive: boolean) {
  return isActive ? 'success' : 'warning';
}

function getTemplateTypeColor(type: string) {
  const map: Record<string, string> = {
    registration_confirmation: 'bg-primary-100 text-primary-600',
    password_setup: 'bg-green-100 text-green-600',
    welcome: 'bg-blue-100 text-blue-600',
    rejection: 'bg-red-100 text-red-600',
    clarification_request: 'bg-yellow-100 text-yellow-600',
    election_update: 'bg-purple-100 text-purple-600',
    general_notification: 'bg-gray-100 text-gray-600',
  };
  return map[type] || 'bg-gray-100 text-gray-600';
}

onMounted(() => {
  loadTemplates();
});
</script>

