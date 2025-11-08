<template>
  <MainLayout
    page-title="Edit Email Template"
    page-description="Update email template settings"
  >
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <Alert v-else-if="error" type="error" :message="error" class="mb-4" />

    <div v-else class="max-w-4xl mx-auto">
      <!-- Form -->
      <form @submit.prevent="saveTemplate" class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">
            Template Details
          </h2>

          <div class="space-y-4">
            <FormField
              v-model="formData.name"
              label="Template Name"
              placeholder="e.g., Welcome Email"
              required
            />

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Template Type
              </label>
              <input
                :value="template?.templateType"
                disabled
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500">
                Template type cannot be changed after creation
              </p>
            </div>

            <FormField
              v-model="formData.subject"
              label="Email Subject"
              placeholder="e.g., Welcome {{firstName}}!"
              required
            />

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email Body (HTML)
              </label>
              <RichTextEditor v-model="formData.body" />
              <p class="mt-1 text-xs text-gray-500">
                Use double curly braces (&#123;&#123; variableName &#125;&#125;)
                for dynamic variables
              </p>
            </div>

            <FormField
              v-model="formData.description"
              label="Description"
              placeholder="Brief description of when this template is used"
              type="textarea"
              :rows="3"
            />

            <div class="flex items-center">
              <input
                type="checkbox"
                v-model="formData.isActive"
                id="isActive"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="isActive" class="ml-2 block text-sm text-gray-900">
                Active (enabled for use)
              </label>
            </div>
          </div>
        </div>

        <!-- Variables Info -->
        <div
          v-if="template?.variables"
          class="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h3 class="text-sm font-semibold text-blue-900 mb-2">
            Available Variables
          </h3>
          <div class="text-sm text-blue-800 space-y-1">
            <div
              v-for="(desc, key) in template.variables"
              :key="key"
              class="flex items-start"
            >
              <span class="font-mono font-medium mr-2"
                >&#123;&#123;{{ ' ' + key + ' ' }}&#125;&#125;</span
              >
              <span class="text-blue-700">{{ desc }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          class="flex justify-between items-center pt-4 border-t border-gray-200"
        >
          <Button variant="secondary" @click="goBack" type="button">
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Templates
          </Button>

          <div class="flex gap-3">
            <Button
              variant="secondary"
              @click="previewTemplate"
              type="button"
              :disabled="saving"
            >
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview
            </Button>
            <Button variant="primary" type="submit" :loading="saving">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>

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
        <Button variant="secondary" @click="showPreviewModal = false">
          Close
        </Button>
      </div>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import FormField from '@/components/common/FormField.vue';
import Modal from '@/components/common/Modal.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import RichTextEditor from '@/components/common/RichTextEditor.vue';
import api from '@/utils/api';

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
const route = useRoute();

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const template = ref<EmailTemplate | null>(null);
const showPreviewModal = ref(false);
const previewData = ref<{ subject: string; body: string } | null>(null);

const formData = ref({
  name: '',
  subject: '',
  body: '',
  description: '',
  templateType: '',
  isActive: true,
});

async function loadTemplate() {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get(
      `/communication/templates/${route.params.id}`
    );
    template.value = response.data.data;

    // Populate form data
    formData.value = {
      name: template.value.name,
      subject: template.value.subject,
      body: template.value.body,
      description: template.value.description || '',
      templateType: template.value.templateType,
      isActive: template.value.isActive,
    };
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load template';
  } finally {
    loading.value = false;
  }
}

async function saveTemplate() {
  saving.value = true;
  error.value = null;

  try {
    await api.put(
      `/communication/templates/${route.params.id}`,
      formData.value
    );

    // Go back to templates page
    router.push('/communication/templates');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save template';
  } finally {
    saving.value = false;
  }
}

async function previewTemplate() {
  if (!template.value) return;

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
      templateType: template.value.templateType,
      variables: sampleVariables,
    });

    previewData.value = response.data.data;
    showPreviewModal.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to preview template';
  }
}

function goBack() {
  router.push('/communication/templates');
}

onMounted(() => {
  loadTemplate();
});
</script>
