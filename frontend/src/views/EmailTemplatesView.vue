<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            Email Templates
          </h1>
          <p class="text-sm sm:text-base text-gray-600 mt-1">
            Manage email templates for system notifications
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

      <!-- Search and Filters -->
      <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div class="space-y-4 md:space-y-0">
          <div class="w-full">
            <SearchBar
              v-model="searchQuery"
              placeholder="Search templates by name, subject, or type..."
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
              >Reset Filters</Button
            >
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

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error State -->
      <Alert v-else-if="error" type="error" :message="error" class="mb-4" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="filteredTemplates.length === 0"
        title="No email templates"
        description="No templates match your search criteria"
      >
        <Button variant="primary" @click="showCreateModal = true"
          >Create Template</Button
        >
      </EmptyState>

      <!-- Templates Table -->
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
          <div class="flex items-start sm:items-center py-2">
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
                <div class="text-xs text-gray-600">{{ item.subject }}</div>
                <div class="flex gap-1">
                  <Badge
                    :variant="getStatusBadgeVariant(item.isActive)"
                    size="sm"
                    >{{ item.isActive ? 'Active' : 'Inactive' }}</Badge
                  >
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #cell-type="{ item }"
          ><span class="text-sm text-gray-900">{{
            formatType(item.templateType)
          }}</span></template
        >
        <template #cell-subject="{ item }"
          ><span class="text-sm text-gray-900 line-clamp-2">{{
            item.subject
          }}</span></template
        >
        <template #cell-status="{ item }"
          ><Badge :variant="getStatusBadgeVariant(item.isActive)">{{
            item.isActive ? 'Active' : 'Inactive'
          }}</Badge></template
        >
        <template #cell-updated="{ item }"
          ><span class="text-sm text-gray-500">{{
            formatDate(item.updatedAt)
          }}</span></template
        >
        <template #cell-actions="{ item }">
          <Dropdown
            button-label="Actions"
            button-class="px-3 py-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
          >
            <DropdownItem @click="editTemplate(item)"
              >Edit Template</DropdownItem
            >
            <DropdownItem @click="previewTemplate(item)">Preview</DropdownItem>
            <DropdownItem
              @click="toggleTemplateStatus(item)"
              :variant="item.isActive ? 'warning' : 'success'"
              >{{ item.isActive ? 'Deactivate' : 'Activate' }}</DropdownItem
            >
            <DropdownItem @click="deleteTemplate(item)" variant="danger"
              >Delete</DropdownItem
            >
          </Dropdown>
        </template>
      </Table>
    </div>

    <!-- Create Template Modal -->
    <Modal v-model="showCreateModal" title="Create Template" size="xl">
      <form @submit.prevent="saveTemplate" class="space-y-4">
        <FormField
          v-model="formData.name"
          label="Template Name"
          placeholder="e.g., Welcome Email"
          required
        />
        <Select
          v-model="formData.templateType"
          label="Template Type"
          placeholder="Select type"
          :options="templateTypeOptions"
          required
        />
        <FormField
          v-model="formData.subject"
          label="Email Subject"
          placeholder="e.g., Welcome {{firstName}}!"
          required
        />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Email Body (HTML)</label
          >
          <RichTextEditor v-model="formData.body" />
          <p class="mt-1 text-xs text-gray-500">
            Use {{ variableName }} for dynamic variables
          </p>
        </div>
        <FormField
          v-model="formData.description"
          label="Description"
          placeholder="Brief description of when this template is used"
          type="textarea"
          :rows="2"
        />
        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="formData.isActive"
            id="isActive"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="isActive" class="ml-2 block text-sm text-gray-900"
            >Active (enabled for use)</label
          >
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" @click="closeModal"
            >Cancel</Button
          >
          <Button type="submit" variant="primary" :loading="saving"
            >Create Template</Button
          >
        </div>
      </form>
    </Modal>

    <!-- Preview Modal -->
    <Modal v-model="showPreviewModal" title="Preview Template" size="lg">
      <div v-if="previewData" class="space-y-4">
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Subject:</p>
          <p class="text-sm text-gray-900">{{ previewData.subject }}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Body:</p>
          <div
            class="border border-gray-200 rounded-md p-4 bg-gray-50"
            v-html="previewData.body"
          ></div>
        </div>
      </div>
      <div class="flex justify-end pt-4">
        <Button variant="secondary" @click="showPreviewModal = false"
          >Close</Button
        >
      </div>
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
import RichTextEditor from '@/components/common/RichTextEditor.vue';
import api from '@/utils/api';
import type { TableColumn } from '@/components/common/Table.vue';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
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
const templates = ref<EmailTemplate[]>([]);
const showCreateModal = ref(false);
const showPreviewModal = ref(false);
const previewData = ref<{ subject: string; body: string } | null>(null);
const searchQuery = ref('');
const typeFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const perPage = ref(10);

const formData = ref({
  name: '',
  subject: '',
  body: '',
  description: '',
  templateType: '',
  isActive: true,
});

const templateTypeOptions = [
  { label: 'Registration Confirmation', value: 'registration_confirmation' },
  { label: 'Password Setup', value: 'password_setup' },
  { label: 'Welcome Email', value: 'welcome' },
  { label: 'Rejection Notification', value: 'rejection' },
  { label: 'Clarification Request', value: 'clarification_request' },
];

const tableColumns: TableColumn[] = [
  { key: 'template', label: 'Template', sortable: false },
  { key: 'type', label: 'Type', sortable: false },
  { key: 'subject', label: 'Subject', sortable: false },
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
        template.subject.toLowerCase().includes(query) ||
        template.templateType.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
    );
  }
  if (typeFilter.value)
    filtered = filtered.filter(
      (template) => template.templateType === typeFilter.value
    );
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
    const response = await api.get('/communication/templates');
    templates.value = response.data.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load templates';
  } finally {
    loading.value = false;
  }
}

async function saveTemplate() {
  saving.value = true;
  error.value = null;
  try {
    await api.post('/communication/templates', formData.value);
    closeModal();
    await loadTemplates();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create template';
  } finally {
    saving.value = false;
  }
}

function editTemplate(template: EmailTemplate) {
  router.push(`/communication/templates/${template.id}/edit`);
}

function closeModal() {
  showCreateModal.value = false;
  formData.value = {
    name: '',
    subject: '',
    body: '',
    description: '',
    templateType: '',
    isActive: true,
  };
}

async function previewTemplate(template: EmailTemplate) {
  const sampleVariables: Record<string, string> = {
    firstName: 'John',
    lastName: 'Doe',
    trackingNumber: 'OBS-2025-001234',
    appUrl: 'http://localhost:5173',
    setupUrl: 'http://localhost:5173/agent/setup-password?token=sample',
    loginUrl: 'http://localhost:5173/agent/login',
    rejectionReason: 'Incomplete documentation',
    notes: 'Please provide additional information about your experience.',
  };
  try {
    const response = await api.post('/communication/templates/render', {
      templateType: template.templateType,
      variables: sampleVariables,
    });
    previewData.value = response.data.data;
    showPreviewModal.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to preview template';
  }
}

async function toggleTemplateStatus(template: EmailTemplate) {
  try {
    await api.put(`/communication/templates/${template.id}`, {
      isActive: !template.isActive,
    });
    await loadTemplates();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update template';
  }
}

async function deleteTemplate(template: EmailTemplate) {
  if (
    !confirm(
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`
    )
  )
    return;
  try {
    await api.delete(`/communication/templates/${template.id}`);
    await loadTemplates();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete template';
  }
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

function getTemplateTypeColor(type: string): string {
  const colors: Record<string, string> = {
    registration_confirmation: 'bg-blue-100 text-blue-600',
    password_setup: 'bg-purple-100 text-purple-600',
    welcome: 'bg-green-100 text-green-600',
    rejection: 'bg-red-100 text-red-600',
    clarification_request: 'bg-yellow-100 text-yellow-600',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}

function getStatusBadgeVariant(isActive: boolean): string {
  return isActive ? 'success' : 'gray';
}

function resetFilters() {
  searchQuery.value = '';
  typeFilter.value = '';
  statusFilter.value = '';
}

function handlePerPageChange(value: number) {
  perPage.value = value;
  currentPage.value = 1;
}

onMounted(() => {
  loadTemplates();
});
</script>
