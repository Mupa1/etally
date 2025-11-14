<template>
  <Modal
    v-model="isOpen"
    title="Upload Contestants"
    description="Upload CSV file containing contestants for this election"
    size="xl"
    :closeable="true"
    @close="resetModal"
  >
    <!-- Upload Section -->
    <div v-if="!isUploading && !uploadComplete" class="space-y-6">
      <!-- File Upload Area -->
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleFileDrop"
        :class="{ 'border-primary-500 bg-primary-50': isDragOver }"
      >
        <div class="text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="mt-4">
            <label
              for="file-upload"
              class="cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
            >
              <span>Upload a CSV file</span>
              <input
                id="file-upload"
                ref="fileInput"
                name="file-upload"
                type="file"
                accept=".csv"
                class="sr-only"
                @change="handleFileSelect"
              />
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            CSV files up to 10MB are supported
          </p>
        </div>
      </div>

      <!-- Selected File Info -->
      <div v-if="selectedFile" class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg
              class="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900">
                {{ selectedFile.name }}
              </p>
              <p class="text-sm text-gray-500">
                {{ formatFileSize(selectedFile.size) }}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" @click="clearFile">
            Remove
          </Button>
        </div>
      </div>

      <!-- Preview Section -->
      <div v-if="previewData.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-900">
            Preview ({{ previewData.length }} contestants)
          </h4>
          <Badge variant="info" :label="`${previewData.length} rows`" />
        </div>
        <div class="max-h-64 overflow-auto border border-gray-200 rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  SNo
                </th>
                <th
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Party
                </th>
                <th
                  class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  County
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(row, index) in previewData.slice(0, 10)"
                :key="index"
                class="hover:bg-gray-50"
              >
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {{ row.SNo }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {{ row.OtherNames }} {{ row.Surname }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {{ row.PartyAbbreviation || row.PartyName }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {{ row.County }}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            v-if="previewData.length > 10"
            class="bg-gray-50 px-3 py-2 text-xs text-gray-500 text-center"
          >
            Showing first 10 of {{ previewData.length }} rows
          </div>
        </div>
      </div>

      <!-- CSV Format Information -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-blue-900 mb-2">
          Expected CSV Format
        </h4>
        <p class="text-sm text-blue-700 mb-2">
          Your CSV file should contain the following columns:
        </p>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• <strong>SNo</strong> - Serial number</li>
          <li>• <strong>Surname</strong> - Candidate's last name</li>
          <li>• <strong>OtherNames</strong> - Candidate's first name(s)</li>
          <li>• <strong>CountyCode</strong> - County code</li>
          <li>• <strong>County</strong> - County name</li>
          <li>• <strong>PartyCode</strong> - Political party code</li>
          <li>• <strong>PartyName</strong> - Political party full name</li>
          <li>
            • <strong>PartyAbbreviation</strong> - Political party abbreviation
          </li>
        </ul>
      </div>

      <!-- Error Display -->
      <Alert v-if="error" type="error" :message="error" />
    </div>

    <!-- Upload Progress -->
    <div v-if="isUploading" class="space-y-6">
      <div class="text-center">
        <LoadingSpinner size="lg" class="mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900">
          Uploading contestants...
        </h3>
        <p class="text-sm text-gray-600 mt-2">
          Please wait while we process the file
        </p>
      </div>
    </div>

    <!-- Upload Complete -->
    <div v-if="uploadComplete" class="space-y-6">
      <div class="text-center">
        <div
          class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100"
        >
          <svg
            class="h-6 w-6 text-green-600"
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
        </div>
        <h3 class="mt-4 text-lg font-medium text-gray-900">
          Upload Successful!
        </h3>
        <p class="mt-2 text-sm text-gray-600">
          {{ uploadSummary }}
        </p>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          v-if="!isUploading && !uploadComplete"
          variant="secondary"
          @click="resetModal"
        >
          Cancel
        </Button>
        <Button
          v-if="!isUploading && !uploadComplete && selectedFile"
          variant="primary"
          @click="handleUpload"
          :disabled="!selectedFile || previewData.length === 0"
        >
          Upload Contestants
        </Button>
        <Button
          v-if="uploadComplete"
          variant="primary"
          @click="resetModal"
        >
          Close
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import { useToast } from '@/composables/useToast';
import api from '@/utils/api';

interface Props {
  modelValue: boolean;
  electionId?: string;
  contestId?: string;
  electionType?: string;
}

const props = withDefaults(defineProps<Props>(), {
  electionId: '',
  contestId: '',
  electionType: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'uploaded'): void;
}>();

const toast = useToast();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragOver = ref(false);
const isUploading = ref(false);
const uploadComplete = ref(false);
const error = ref('');
const previewData = ref<any[]>([]);
const uploadSummary = ref('');

watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    resetModal();
  }
});

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave() {
  isDragOver.value = false;
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    error.value = 'Please select a CSV file';
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    error.value = 'File size must be less than 10MB';
    return;
  }

  selectedFile.value = file;
  error.value = '';

  // Parse CSV and show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      previewData.value = parsed;

      if (parsed.length === 0) {
        error.value = 'No valid data found in CSV file';
      }
    } catch (err) {
      error.value = 'Error parsing CSV file: ' + (err as Error).message;
      console.error('CSV parsing error:', err);
    }
  };

  reader.onerror = () => {
    error.value = 'Error reading file';
  };

  reader.readAsText(file);
}

function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length <= 1) {
    return [];
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Validate headers
  const requiredHeaders = [
    'SNo',
    'Surname',
    'OtherNames',
    'CountyCode',
    'County',
    'PartyCode',
    'PartyName',
    'PartyAbbreviation',
  ];

  const missingHeaders = requiredHeaders.filter(
    (h) => !headers.includes(h)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required columns: ${missingHeaders.join(', ')}`
    );
  }

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const values = parseCSVLine(line);
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/"/g, '').trim() || '';
      });
      data.push(row);
    }
  }

  return data;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim()); // Add last value

  return values;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function clearFile() {
  selectedFile.value = null;
  previewData.value = [];
  error.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function resetModal() {
  clearFile();
  isUploading.value = false;
  uploadComplete.value = false;
  uploadSummary.value = '';
  error.value = '';
}

async function handleUpload() {
  if (!selectedFile.value || !props.electionId || !props.contestId) {
    error.value = 'Missing required information';
    return;
  }

  if (previewData.value.length === 0) {
    error.value = 'No contestants to upload';
    return;
  }

  isUploading.value = true;
  error.value = '';

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    const response = await api.post(
      `/elections/${props.electionId}/contests/${props.contestId}/contestants/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success) {
      uploadComplete.value = true;
      uploadSummary.value = response.data.message || 'Contestants uploaded successfully';
      toast.success('Contestants uploaded successfully');
      
      // Emit uploaded event after a short delay
      setTimeout(() => {
        emit('uploaded');
      }, 1500);
    }
  } catch (err: any) {
    error.value =
      err.response?.data?.message ||
      'Error uploading contestants. Please try again.';
    toast.error(error.value);
    console.error('Upload error:', err);
  } finally {
    isUploading.value = false;
  }
}
</script>

