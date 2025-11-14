<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3 text-sm text-gray-500">
        <router-link
          to="/communication"
          class="hover:text-primary-600 transition-colors"
        >
          Communication
        </router-link>
        <span>/</span>
        <router-link
          to="/communication/sms-templates"
          class="hover:text-primary-600 transition-colors"
        >
          SMS Templates
        </router-link>
        <span>/</span>
        <span>Edit Template</span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            Edit SMS Template
          </h1>
          <p class="text-sm text-gray-600 mt-1">
            Update SMS template content and settings
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="secondary" @click="router.back()">Cancel</Button>
          <Button variant="primary" :loading="saving" @click="saveTemplate">
            Save Changes
          </Button>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <Alert v-else-if="error" type="error" :message="error" />

      <div
        v-else-if="template"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
      >
        <FormField label="Template Name" required>
          <input
            v-model="formData.name"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Template Type" description="Read-only identifier">
          <input
            v-model="formData.templateType"
            type="text"
            disabled
            class="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
          />
        </FormField>

        <FormField
          label="Message Body"
          required
          description="Use {{variable}} notation for placeholders"
        >
          <textarea
            v-model="formData.body"
            rows="6"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          ></textarea>
        </FormField>

        <div class="flex items-center gap-2">
          <input
            id="isActive"
            v-model="formData.isActive"
            type="checkbox"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label for="isActive" class="text-sm text-gray-700">
            Template is active
          </label>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import FormField from '@/components/common/FormField.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import api from '@/utils/api';

interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  description?: string;
  templateType: string;
  isActive: boolean;
}

const route = useRoute();
const router = useRouter();

const template = ref<SmsTemplate | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

const formData = ref({
  name: '',
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
      `/communication/sms-templates/${route.params.id}`
    );
    template.value = response.data.data;
    formData.value = {
      name: template.value.name,
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
  if (!template.value) return;

  saving.value = true;
  error.value = null;

  try {
    await api.put(
      `/communication/sms-templates/${template.value.id}`,
      formData.value
    );
    router.push('/communication/sms-templates');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save template';
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadTemplate();
});
</script>

