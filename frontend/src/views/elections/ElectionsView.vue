<template>
  <MainLayout
    page-title="Elections"
    page-description="Manage and monitor all elections"
  >
    <div class="space-y-6">
      <!-- Header with Create Button -->
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Elections</h1>
          <p class="text-sm text-gray-600 mt-1">
            View and manage all elections in the system
          </p>
        </div>
        <Button variant="primary" @click="goToCreate" class="w-full sm:w-auto">
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
          Create Election
        </Button>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="space-y-4 md:space-y-0">
          <div class="w-full">
            <SearchBar
              v-model="searchQuery"
              placeholder="Search by code, title or description..."
              :debounce="300"
              @search="handleSearch"
              @clear="handleClearSearch"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Select
              v-model="selectedStatus"
              label="Status"
              placeholder="All Statuses"
              :options="statusOptions"
            />

            <Select
              v-model="selectedType"
              label="Type"
              placeholder="All Types"
              :options="typeOptions"
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
              @click="applyFilters"
              class="w-full sm:w-auto"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card">
        <div class="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" class="text-primary-600" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && elections.length === 0" class="card">
        <EmptyState
          icon="folder"
          title="No elections found"
          :description="
            searchQuery || selectedStatus || selectedType
              ? 'Try adjusting your filters'
              : 'Get started by creating your first election'
          "
          action-label="Create Election"
          @action="goToCreate"
        />
      </div>

      <!-- Elections List -->
      <div v-else class="space-y-4">
        <div
          v-for="election in elections"
          :key="election.id"
          class="card hover:shadow-lg transition-shadow cursor-pointer"
          @click="goToDetail(election.id)"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ election.title }}
                </h3>
                <Badge
                  :variant="getStatusVariant(election.status)"
                  :label="formatStatus(election.status)"
                />
                <Badge
                  variant="info"
                  :label="formatElectionType(election.electionType)"
                  size="sm"
                />
              </div>
              <div
                class="flex flex-wrap items-center gap-4 text-sm text-gray-600"
              >
                <div class="flex items-center">
                  <svg
                    class="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span class="font-medium">{{ election.electionCode }}</span>
                </div>
                <div class="flex items-center">
                  <svg
                    class="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{{ formatDate(election.electionDate) }}</span>
                </div>
                <div
                  v-if="election.contests && election.contests.length > 0"
                  class="flex items-center"
                >
                  <svg
                    class="w-4 h-4 mr-1.5"
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
                  <span>{{ election.contests.length }} contest(s)</span>
                </div>
              </div>
              <p
                v-if="election.description"
                class="text-sm text-gray-600 mt-2 line-clamp-2"
              >
                {{ election.description }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                @click.stop="goToDetail(election.id)"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <Alert v-if="error" variant="danger" :message="error" />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import api from '@/utils/api';
import { handleError } from '@/utils/errorHandler';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Alert from '@/components/common/Alert.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import Select from '@/components/common/Select.vue';

const router = useRouter();
const toast = useToast();

const elections = ref<any[]>([]);
const loading = ref(false);
const error = ref('');
const searchQuery = ref('');
const selectedStatus = ref<StatusOptionValue | ''>('');
const selectedType = ref<ElectionTypeOptionValue | ''>('');

type StatusOptionValue =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'cancelled';
type ElectionTypeOptionValue =
  | 'general_election'
  | 'by_election'
  | 'referendum'
  | 're_run_election';

const statusOptions: Array<{ value: StatusOptionValue; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const typeOptions: Array<{ value: ElectionTypeOptionValue; label: string }> = [
  { value: 'general_election', label: 'General Election' },
  { value: 'by_election', label: 'By-Election' },
  { value: 'referendum', label: 'Referendum' },
  { value: 're_run_election', label: 'Re-Run Election' },
];

onMounted(() => {
  loadElections();
});

async function loadElections() {
  loading.value = true;
  error.value = '';

  try {
    const params: any = {};

    if (selectedStatus.value) {
      params.status = selectedStatus.value;
    }

    if (selectedType.value) {
      params.electionType = selectedType.value;
    }

    const response = await api.get('/elections', { params });

    let data = response.data.data || [];

    // Filter by search query if provided
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();
      data = data.filter(
        (election: any) =>
          election.electionCode?.toLowerCase().includes(query) ||
          election.title?.toLowerCase().includes(query) ||
          election.description?.toLowerCase().includes(query)
      );
    }

    elections.value = data;
  } catch (err: any) {
    const recovery = handleError(err, {
      component: 'ElectionsView',
      action: 'load_elections',
    });

    error.value = err.response?.data?.message || 'Failed to load elections';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

function handleSearch(value: string) {
  searchQuery.value = value;
  loadElections();
}

function handleClearSearch() {
  searchQuery.value = '';
  loadElections();
}

function applyFilters() {
  loadElections();
}

function goToCreate() {
  router.push('/elections/create');
}

function goToDetail(id: string) {
  router.push(`/elections/${id}`);
}

function resetFilters() {
  searchQuery.value = '';
  selectedStatus.value = '';
  selectedType.value = '';
  loadElections();
}

function formatDate(date: string | Date): string {
  if (!date) return 'Not set';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return statusMap[status] || status;
}

type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'gray';

function getStatusVariant(status: string): BadgeVariant {
  const variantMap: Record<string, BadgeVariant> = {
    draft: 'gray',
    scheduled: 'info',
    active: 'success',
    completed: 'secondary',
    cancelled: 'danger',
  };
  return variantMap[status] || 'gray';
}

function formatElectionType(type: string): string {
  const typeMap: Record<string, string> = {
    general_election: 'General',
    by_election: 'By-Election',
    referendum: 'Referendum',
    re_run_election: 'Re-Run',
  };
  return typeMap[type] || type;
}
</script>
