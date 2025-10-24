<template>
  <MainLayout
    page-title="Party Management"
    page-description="Manage political parties and coalitions"
  >
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        title="Total Parties"
        :value="stats.total"
        color="primary"
        :loading="loading"
      >
        <template #icon>
          <PartyIcon class="w-6 h-6 text-primary-600" />
        </template>
      </StatCard>

      <StatCard
        title="Active Parties"
        :value="stats.active"
        color="success"
        :loading="loading"
      >
        <template #icon>
          <svg
            class="w-6 h-6 text-success-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </template>
      </StatCard>

      <StatCard
        title="Coalitions"
        :value="stats.coalitions"
        color="warning"
        :loading="loading"
      >
        <template #icon>
          <svg
            class="w-6 h-6 text-warning-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </template>
      </StatCard>
    </div>

    <!-- Search and Actions -->
    <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div class="flex flex-col gap-4">
        <!-- Search Bar -->
        <SearchBar
          v-model="searchQuery"
          placeholder="Search parties by name, abbreviation, or code..."
        />

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-2">
          <Button
            variant="primary"
            :leading-icon="PlusIcon"
            @click="showCreateModal = true"
          >
            Add Party
          </Button>

          <Button variant="success" @click="triggerFileUpload">
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span class="ml-2">Upload Parties</span>
          </Button>

          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleFileUpload"
          />

          <Button
            v-if="parties.length > 0"
            variant="secondary"
            @click="exportToCSV"
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <span class="ml-2">Download Parties</span>
          </Button>
        </div>
      </div>
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

    <!-- Parties Table -->
    <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Party
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Code
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="party in filteredParties"
              :key="party.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    v-if="party.logoUrl"
                    class="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      :src="party.logoUrl"
                      :alt="party.partyName"
                      class="h-10 w-10 object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="flex-shrink-0 min-w-10 h-10 rounded-lg flex items-center justify-center px-2"
                    :style="{
                      backgroundColor: (party.primaryColor || '#0047AB') + '20',
                    }"
                  >
                    <span
                      class="text-xs font-bold text-center leading-tight break-words"
                      :style="{ color: party.primaryColor || '#0047AB' }"
                    >
                      {{ party.abbreviation }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ party.partyName }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ party.abbreviation }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge variant="secondary">
                  {{ party.certificateNumber }}
                </Badge>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <Badge :variant="party.isActive ? 'success' : 'secondary'">
                  {{ party.isActive ? 'Active' : 'Inactive' }}
                </Badge>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  @click="viewParty(party)"
                  class="text-primary-600 hover:text-primary-900"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-if="filteredParties.length === 0"
        title="No parties found"
        description="Get started by importing parties from a CSV file or creating your first party."
        action-label="Create Party"
        @action="showCreateModal = true"
      >
        <template #icon>
          <PartyIcon class="w-full h-full text-gray-400" />
        </template>
      </EmptyState>
    </div>

    <!-- CSV Import Preview Modal -->
    <Modal
      v-model="showImportPreview"
      title="Import Preview"
      :description="`${importData.length} parties found`"
      size="xl"
      @close="cancelImport"
    >
      <Alert
        v-if="importStatus"
        :variant="importStatus.type === 'success' ? 'success' : 'warning'"
        :message="importStatus.message"
        class="mb-4"
      />

      <!-- Preview Table -->
      <div class="overflow-x-auto border border-gray-200 rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                #
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Name
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Abbr.
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Cert. No.
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Colors
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Slogan
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(party, index) in importData.slice(0, 10)"
              :key="index"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-2 text-sm text-gray-500">
                {{ party.serialNo }}
              </td>
              <td class="px-4 py-2 text-sm font-medium text-gray-900">
                {{ party.name }}
              </td>
              <td class="px-4 py-2 text-sm text-gray-600">
                {{ party.abbreviation }}
              </td>
              <td class="px-4 py-2 text-sm text-gray-500">
                {{ party.certificateNo }}
              </td>
              <td class="px-4 py-2 text-sm text-gray-600">
                {{ party.colors }}
              </td>
              <td class="px-4 py-2 text-sm text-gray-500 truncate max-w-xs">
                {{ party.slogan }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="importData.length > 10" class="text-sm text-gray-500 mt-4">
        Showing 10 of {{ importData.length }} parties
      </p>

      <template #footer>
        <div class="flex gap-3">
          <Button
            variant="primary"
            :loading="loading"
            @click="confirmImport"
            class="flex-1"
          >
            Import {{ importData.length }} Parties
          </Button>
          <Button variant="secondary" @click="cancelImport">Cancel</Button>
        </div>
      </template>
    </Modal>

    <!-- Create/Edit Party Modal -->
    <Modal
      v-model="showCreateModal"
      :title="editingParty ? 'Edit Party' : 'Create New Party'"
      size="md"
    >
      <p class="text-gray-600">Party management functionality coming soon...</p>

      <template #footer>
        <Button variant="secondary" @click="showCreateModal = false">
          Close
        </Button>
      </template>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import StatCard from '@/components/common/StatCard.vue';
import Button from '@/components/common/Button.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import Modal from '@/components/common/Modal.vue';
import Badge from '@/components/common/Badge.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { PartyIcon, PlusIcon } from '@/components/icons';
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

interface ImportParty {
  serialNo: string;
  certificateNo: string;
  name: string;
  abbreviation: string;
  certificateDate: string;
  symbol: string;
  colors: string;
  postalAddress: string;
  headOffice: string;
  slogan: string;
  changes: string;
}

const router = useRouter();

const loading = ref(false);
const error = ref('');
const searchQuery = ref('');
const showCreateModal = ref(false);
const showImportPreview = ref(false);
const editingParty = ref<Party | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const importData = ref<ImportParty[]>([]);
const importStatus = ref<{ type: string; message: string } | null>(null);

// Data from API
const parties = ref<Party[]>([]);

const stats = computed(() => ({
  total: parties.value.length,
  active: parties.value.filter((p) => p.isActive).length,
  coalitions: 0, // Placeholder for coalition count
}));

const filteredParties = computed(() => {
  if (!searchQuery.value) return parties.value;

  const query = searchQuery.value.toLowerCase();
  return parties.value.filter(
    (party) =>
      party.partyName.toLowerCase().includes(query) ||
      (party.abbreviation &&
        party.abbreviation.toLowerCase().includes(query)) ||
      party.certificateNumber.toLowerCase().includes(query)
  );
});

function triggerFileUpload() {
  fileInput.value?.click();
}

function parseCSV(text: string): ImportParty[] {
  const lines = text.split('\n').filter((line) => line.trim());
  const result: ImportParty[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    // Parse CSV with proper quote handling
    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 11) {
      result.push({
        serialNo: values[0],
        certificateNo: values[1],
        name: values[2],
        abbreviation: values[3],
        certificateDate: values[4],
        symbol: values[5],
        colors: values[6],
        postalAddress: values[7],
        headOffice: values[8],
        slogan: values[9],
        changes: values[10] || '',
      });
    }
  }

  return result;
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Preview CSV content first
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      importData.value = parseCSV(text);

      if (importData.value.length > 0) {
        showImportPreview.value = true;
        importStatus.value = {
          type: 'success',
          message: `Successfully parsed ${importData.value.length} parties from CSV file.`,
        };
      } else {
        error.value = 'No valid party data found in CSV file.';
      }
    } catch (err) {
      error.value = 'Error parsing CSV file. Please check the format.';
      console.error('CSV parsing error:', err);
    }
  };

  reader.readAsText(file);

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function confirmImport() {
  try {
    loading.value = true;

    // Create FormData and append CSV file
    const formData = new FormData();
    const csvContent = [
      'S/No,Certificate Serial No.,Name of the Party,Abbreviation,Certificate Date of Issue,Symbol,Colors,Postal Address of Party,Location of Head Office of Party,Slogan,Changes',
      ...importData.value.map((party) =>
        [
          party.serialNo,
          party.certificateNo,
          party.name,
          party.abbreviation,
          party.certificateDate,
          party.symbol,
          party.colors,
          party.postalAddress,
          party.headOffice,
          party.slogan,
          party.changes,
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', blob, 'parties.csv');

    // Upload to backend
    const response = await api.post('/parties/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      importStatus.value = {
        type: 'success',
        message: response.data.message,
      };

      // Reload parties
      await loadParties();

      setTimeout(() => {
        showImportPreview.value = false;
        importData.value = [];
        importStatus.value = null;
      }, 2000);
    }
  } catch (err: any) {
    importStatus.value = {
      type: 'error',
      message:
        err.response?.data?.message ||
        'Error importing parties. Please try again.',
    };
    console.error('Import error:', err);
  } finally {
    loading.value = false;
  }
}

function cancelImport() {
  showImportPreview.value = false;
  importData.value = [];
  importStatus.value = null;
}

async function exportToCSV() {
  try {
    loading.value = true;

    // Download CSV from backend
    const response = await api.get('/parties/download', {
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `political-parties-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Error downloading parties CSV';
    console.error('Export error:', err);
  } finally {
    loading.value = false;
  }
}

function viewParty(party: Party) {
  router.push(`/admin/parties/${party.id}`);
}

async function deleteParty(party: Party) {
  if (confirm(`Are you sure you want to delete ${party.partyName}?`)) {
    try {
      loading.value = true;
      await api.delete(`/parties/${party.id}`);

      // Remove from local array
      const index = parties.value.findIndex((p) => p.id === party.id);
      if (index > -1) {
        parties.value.splice(index, 1);
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting party';
      console.error('Delete error:', err);
    } finally {
      loading.value = false;
    }
  }
}

async function loadParties() {
  try {
    loading.value = true;
    error.value = '';

    const response = await api.get('/parties');

    if (response.data.success) {
      parties.value = response.data.data;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error loading parties';
    console.error('Load error:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadParties();
});
</script>
