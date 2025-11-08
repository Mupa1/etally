<template>
  <Modal
    v-model="isOpen"
    title="Upload Voting Areas"
    description="Upload CSV file containing counties, constituencies, wards, and polling stations"
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

      <!-- CSV Format Information -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-blue-900 mb-2">
          Expected CSV Format
        </h4>
        <p class="text-sm text-blue-700 mb-2">
          Your CSV file should contain the following columns (in this order):
        </p>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• <strong>County Code</strong> - County identifier code</li>
          <li>• <strong>County Name</strong> - Name of the county</li>
          <li>• <strong>Const Code</strong> - Constituency identifier code</li>
          <li>• <strong>Const. Name</strong> - Name of the constituency</li>
          <li>• <strong>CAW Code</strong> - Ward identifier code</li>
          <li>• <strong>CAW Name</strong> - Name of the ward</li>
          <li>
            • <strong>Reg. Centre Code</strong> - Registration center code
          </li>
          <li>
            • <strong>Reg. Centre Name</strong> - Registration center name
          </li>
          <li>
            • <strong>Polling Station Code</strong> - Unique polling station
            code
          </li>
          <li>
            • <strong>Polling Station Name</strong> - Name of the polling
            station
          </li>
          <li>
            • <strong>Registered Voters</strong> - Number of registered voters
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
          Processing {{ selectedFile?.name }}
        </h3>
        <p class="text-sm text-gray-600 mt-2">
          {{ progressMessage }}
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="w-full">
        <div class="flex justify-between text-sm text-gray-600 mb-2">
          <span>{{ currentStep }} / {{ totalSteps }}</span>
          <span>{{ progressPercentage }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Detailed Progress -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-900">Rows Processed:</span>
            <span class="ml-2 text-gray-600"
              >{{ processedRows }} / {{ totalRows }}</span
            >
          </div>
          <div>
            <span class="font-medium text-gray-900">Current Action:</span>
            <span class="ml-2 text-gray-600">{{ currentAction }}</span>
          </div>
        </div>
      </div>

      <!-- Cancel Button -->
      <div class="text-center">
        <Button variant="secondary" @click="cancelUpload">
          Cancel Upload
        </Button>
      </div>
    </div>

    <!-- Upload Complete -->
    <div v-if="uploadComplete && !error" class="space-y-6">
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
        <h3 class="mt-4 text-lg font-medium text-gray-900">Upload Complete!</h3>
        <p class="mt-2 text-sm text-gray-600">
          Successfully processed {{ totalRows }} voting area records.
        </p>
      </div>

      <!-- Summary Statistics -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-green-900 mb-3">Upload Summary</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-green-900">Counties:</span>
            <span class="ml-2 text-green-700">
              {{ summary.countiesAdded }} added,
              {{ summary.countiesUpdated }} updated
            </span>
          </div>
          <div>
            <span class="font-medium text-green-900">Constituencies:</span>
            <span class="ml-2 text-green-700">
              {{ summary.constituenciesAdded }} added,
              {{ summary.constituenciesUpdated }} updated
            </span>
          </div>
          <div>
            <span class="font-medium text-green-900">Wards:</span>
            <span class="ml-2 text-green-700">
              {{ summary.wardsAdded }} added, {{ summary.wardsUpdated }} updated
            </span>
          </div>
          <div>
            <span class="font-medium text-green-900">Polling Stations:</span>
            <span class="ml-2 text-green-700">
              {{ summary.pollingStationsAdded }} added,
              {{ summary.pollingStationsUpdated }} updated
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="flex justify-end space-x-3">
        <Button
          v-if="!isUploading && !uploadComplete"
          variant="secondary"
          @click="resetModal"
        >
          Cancel
        </Button>
        <Button
          v-if="selectedFile && !isUploading && !uploadComplete"
          variant="primary"
          :disabled="!selectedFile || isProcessing"
          @click="startUpload"
        >
          <LoadingSpinner v-if="isProcessing" size="sm" class="mr-2" />
          Upload & Process
        </Button>
        <Button
          v-if="uploadComplete"
          variant="primary"
          @click="handleUploadComplete"
        >
          Done
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Alert from '@/components/common/Alert.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import api from '@/utils/api';

interface Props {
  modelValue: boolean;
}

interface UploadSummary {
  countiesAdded: number;
  countiesUpdated: number;
  constituenciesAdded: number;
  constituenciesUpdated: number;
  wardsAdded: number;
  wardsUpdated: number;
  pollingStationsAdded: number;
  pollingStationsUpdated: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'upload-complete', summary: UploadSummary): void;
}>();

// State
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const isProcessing = ref(false);
const uploadComplete = ref(false);
const error = ref<string | null>(null);
const cancelRequested = ref(false);
const isDragOver = ref(false);

// Progress tracking
const currentStep = ref(0);
const totalSteps = ref(4); // Parse, Validate, Process, Complete
const processedRows = ref(0);
const totalRows = ref(0);
const currentAction = ref('');
const progressMessage = ref('');

// Summary
const summary = ref<UploadSummary>({
  countiesAdded: 0,
  countiesUpdated: 0,
  constituenciesAdded: 0,
  constituenciesUpdated: 0,
  wardsAdded: 0,
  wardsUpdated: 0,
  pollingStationsAdded: 0,
  pollingStationsUpdated: 0,
});

const fileInput = ref<HTMLInputElement | null>(null);

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const progressPercentage = computed(() => {
  if (totalSteps.value === 0) return 0;
  return Math.round((currentStep.value / totalSteps.value) * 100);
});

// Methods
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    validateAndSetFile(file);
  }
}

function handleFileDrop(event: DragEvent) {
  isDragOver.value = false;
  const files = event.dataTransfer?.files;

  if (files && files.length > 0) {
    const file = files[0];
    validateAndSetFile(file);
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  // Only set to false if we're leaving the drop zone entirely
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOver.value = false;
  }
}

function validateAndSetFile(file: File) {
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    error.value = 'Please select a CSV file';
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    // 10MB limit
    error.value = 'File size must be less than 10MB';
    return;
  }

  selectedFile.value = file;
  error.value = null;
}

function clearFile() {
  selectedFile.value = null;
  error.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function startUpload() {
  if (!selectedFile.value) return;

  isUploading.value = true;
  isProcessing.value = true;
  cancelRequested.value = false;
  error.value = null;

  try {
    await processFile();
  } catch (err: any) {
    if (!cancelRequested.value) {
      error.value = err.message || 'Upload failed. Please try again.';
    }
  } finally {
    isUploading.value = false;
    isProcessing.value = false;
  }
}

async function processFile() {
  if (!selectedFile.value) return;

  // Step 1: Parse CSV
  currentStep.value = 1;
  progressMessage.value = 'Parsing CSV file...';
  currentAction.value = 'Reading file contents';

  const csvData = await parseCSV(selectedFile.value);
  totalRows.value = csvData.length;
  processedRows.value = 0;

  if (cancelRequested.value) throw new Error('Upload cancelled');

  // Step 2: Validate data
  currentStep.value = 2;
  progressMessage.value = 'Validating data...';
  currentAction.value = `Validating ${totalRows.value} records`;

  const validatedData = validateCSVData(csvData);

  if (cancelRequested.value) throw new Error('Upload cancelled');

  // Step 3: Process and upload
  currentStep.value = 3;
  progressMessage.value = 'Processing and uploading data...';
  currentAction.value = 'Preparing data for upload';

  const result = await uploadVotingAreas(validatedData);

  if (cancelRequested.value) throw new Error('Upload cancelled');

  // Step 4: Complete
  currentStep.value = 4;
  progressMessage.value = 'Upload complete!';
  currentAction.value = 'Processing completed';

  summary.value = result.summary;
  uploadComplete.value = true;
}

function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        // Parse header
        const headers = parseCSVLine(lines[0]);

        // Validate headers match expected format
        if (!validateCSVHeaders(headers)) {
          reject(
            new Error(
              'CSV file format does not match expected format. Please ensure the file has the correct column headers in the right order.'
            )
          );
          return;
        }

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line === '') continue; // Skip empty lines

          const values = parseCSVLine(line);
          if (values.length === headers.length) {
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.replace(/"/g, '').trim() || '';
            });
            data.push(row);
          } else {
            console.warn(
              `Skipping malformed row ${i + 1}: expected ${headers.length} columns, got ${values.length}`
            );
          }
        }

        resolve(data);
      } catch (err) {
        reject(
          new Error('Failed to parse CSV file: ' + (err as Error).message)
        );
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Helper function to validate CSV headers match expected format
function validateCSVHeaders(headers: string[]): boolean {
  const expectedHeaders = [
    'County Code',
    'County Name',
    'Const Code',
    'Const. Name',
    'CAW Code',
    'CAW Name',
    'Reg. Centre Code',
    'Reg. Centre Name',
    'Polling Station Code',
    'Polling Station Name',
    'Registered Voters',
  ];

  if (headers.length !== expectedHeaders.length) {
    return false;
  }

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i] !== expectedHeaders[i]) {
      return false;
    }
  }

  return true;
}

function validateCSVData(data: any[]): any[] {
  const requiredColumns = [
    'County Code',
    'County Name',
    'Const Code',
    'Const. Name',
    'CAW Code',
    'CAW Name',
    'Polling Station Code',
    'Polling Station Name',
    'Registered Voters',
  ];

  const validatedData = [];

  for (const row of data) {
    // Check required columns
    const missingColumns = requiredColumns.filter(
      (col) => !row[col] || row[col].toString().trim() === ''
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Convert registered voters to number if present
    if (row['Registered Voters']) {
      const voters = parseInt(row['Registered Voters'].toString());
      if (isNaN(voters) || voters < 0) {
        row['Registered Voters'] = 0;
      } else {
        row['Registered Voters'] = voters;
      }
    }

    // Normalize the data structure for easier processing
    const normalizedRow = {
      countyCode: row['County Code']?.toString().trim(),
      countyName: row['County Name']?.toString().trim(),
      constituencyCode: row['Const Code']?.toString().trim(),
      constituencyName: row['Const. Name']?.toString().trim(),
      wardCode: row['CAW Code']?.toString().trim(),
      wardName: row['CAW Name']?.toString().trim(),
      regCenterCode: row['Reg. Centre Code']?.toString().trim(),
      regCenterName: row['Reg. Centre Name']?.toString().trim(),
      pollingStationCode: row['Polling Station Code']?.toString().trim(),
      pollingStationName: row['Polling Station Name']?.toString().trim(),
      registeredVoters: row['Registered Voters'],
    };

    validatedData.push(normalizedRow);
  }

  return validatedData;
}

async function uploadVotingAreas(data: any[]) {
  // Process in smaller chunks for large datasets (40,000+ rows)
  const chunkSize = 500; // Reduced chunk size for better memory management
  const chunks = [];

  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }

  let totalSummary: UploadSummary = {
    countiesAdded: 0,
    countiesUpdated: 0,
    constituenciesAdded: 0,
    constituenciesUpdated: 0,
    wardsAdded: 0,
    wardsUpdated: 0,
    pollingStationsAdded: 0,
    pollingStationsUpdated: 0,
  };

  for (let i = 0; i < chunks.length; i++) {
    if (cancelRequested.value) throw new Error('Upload cancelled');

    currentAction.value = `Uploading chunk ${i + 1} of ${chunks.length} (${chunks[i].length} records)`;

    try {
      // Send JSON data directly instead of FormData for better performance
      const response = await api.post(
        '/geographic/bulk-upload',
        {
          data: chunks[i],
          chunkIndex: i,
          totalChunks: chunks.length,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minute timeout for each chunk
        }
      );

      // Merge summary data
      if (response.data && response.data.summary) {
        const chunkSummary = response.data.summary;
        Object.keys(totalSummary).forEach((key) => {
          totalSummary[key as keyof UploadSummary] += chunkSummary[key] || 0;
        });
      }

      processedRows.value = Math.min((i + 1) * chunkSize, data.length);

      // Add a small delay between chunks to prevent overwhelming the server
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err: any) {
      console.error(`Chunk ${i + 1} upload error:`, err);

      // Provide more specific error messages
      let errorMessage = '';
      if (err.response?.status === 404) {
        errorMessage =
          'Upload endpoint not found. Please contact the administrator to ensure the backend service is properly configured.';
      } else if (err.response?.status === 500) {
        errorMessage =
          'Server error occurred during upload. Please try again or contact support.';
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage =
          'Network error. Please check your connection and try again.';
      } else {
        errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Unknown error occurred';
      }

      throw new Error(`Failed to upload chunk ${i + 1}: ${errorMessage}`);
    }
  }

  return { summary: totalSummary };
}

function cancelUpload() {
  cancelRequested.value = true;
  isUploading.value = false;
  isProcessing.value = false;
  error.value = 'Upload cancelled by user';
}

function resetModal() {
  selectedFile.value = null;
  isUploading.value = false;
  isProcessing.value = false;
  uploadComplete.value = false;
  error.value = null;
  cancelRequested.value = false;
  isDragOver.value = false;
  currentStep.value = 0;
  processedRows.value = 0;
  totalRows.value = 0;
  currentAction.value = '';
  progressMessage.value = '';

  if (fileInput.value) {
    fileInput.value.value = '';
  }

  summary.value = {
    countiesAdded: 0,
    countiesUpdated: 0,
    constituenciesAdded: 0,
    constituenciesUpdated: 0,
    wardsAdded: 0,
    wardsUpdated: 0,
    pollingStationsAdded: 0,
    pollingStationsUpdated: 0,
  };
}

function handleUploadComplete() {
  emit('upload-complete', summary.value);
  resetModal();
  isOpen.value = false;
}
</script>
