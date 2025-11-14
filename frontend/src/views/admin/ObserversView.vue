<template>
  <MainLayout
    page-title="Agents Management"
    page-description="Manage field agents, review applications, and monitor agent activities"
  >
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Agents"
        :value="stats.total || 0"
        icon="users"
        color="primary"
      />
      <StatCard
        title="Active Agents"
        :value="stats.active || 0"
        :percentage="stats.total > 0 ? (stats.active / stats.total) * 100 : 0"
        icon="check-circle"
        color="success"
      />
      <StatCard
        title="Pending Applications"
        :value="stats.pending || 0"
        icon="clock"
        color="warning"
      />
      <StatCard
        title="Assigned Agents"
        :value="stats.assigned || 0"
        :percentage="stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0"
        icon="location"
        color="primary"
      />
    </div>

    <!-- Search and Filters -->
    <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div class="space-y-4">
        <!-- Search, Status, and View Mode in same row -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Search - Takes most of the space -->
          <div class="md:col-span-6">
            <SearchBar
              v-model="searchQuery"
              placeholder="Search by name, email, phone, or ID..."
            />
          </div>

          <!-- Status Filter -->
          <div class="md:col-span-3">
            <Select
              v-model="statusFilter"
              label="Status"
              placeholder="All Statuses"
              :options="statusOptions"
            />
          </div>

          <!-- View Mode Filter -->
          <div class="md:col-span-3">
            <Select
              v-model="viewMode"
              label="View Mode"
              placeholder="Select View"
              :options="viewModeOptions"
            />
          </div>
        </div>

        <!-- Actions - Full width on mobile, right-aligned on desktop -->
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
            @click="loadAgents"
            class="w-full sm:w-auto"
            :disabled="loading"
          >
            <i class="icon-refresh mr-2" :class="{ spinning: loading }"></i>
            Refresh
          </Button>
          <Button
            variant="primary"
            @click="exportAgents"
            class="w-full sm:w-auto"
            :disabled="loading"
          >
            <i class="icon-download mr-2"></i>
            Export
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
      v-else-if="filteredAgents.length === 0"
      title="No agents found"
      description="No agents match your search criteria"
    />

    <!-- Agents Table -->
    <Table
      v-else
      :columns="tableColumns"
      :data="filteredAgents"
      :current-page="currentPage"
      :per-page="perPage"
      @page-change="currentPage = $event"
      @per-page-change="handlePerPageChange"
    >
      <!-- Agent Column -->
      <template #cell-agent="{ item }">
        <div class="flex items-start sm:items-center py-2">
          <Avatar
            :user="item"
            size="md"
            color="primary"
            class="flex-shrink-0"
          />
          <div class="ml-3 min-w-0 flex-1">
            <div class="text-sm font-medium text-gray-900">
              {{ item.firstName }} {{ item.lastName }}
            </div>
            <div class="text-xs sm:text-sm text-gray-500">
              ID: {{ item.nationalId }}
            </div>
            <!-- Mobile: Show email and phone -->
            <div class="lg:hidden mt-1 space-y-0.5">
              <div class="text-xs text-gray-600">{{ item.email }}</div>
              <div v-if="item.phoneNumber" class="text-xs text-gray-500">
                {{ item.phoneNumber }}
              </div>
            </div>
            <!-- Mobile: Show status badges -->
            <div class="sm:hidden mt-2 flex flex-wrap gap-1">
              <Badge :variant="getStatusBadgeVariant(item.status)" size="sm">
                {{ formatStatus(item.status) }}
              </Badge>
            </div>
          </div>
        </div>
      </template>

      <!-- Contact Column -->
      <template #cell-contact="{ item }">
        <div class="text-sm text-gray-900">{{ item.email }}</div>
        <div class="text-sm text-gray-500">{{ item.phoneNumber || 'N/A' }}</div>
      </template>

      <!-- County Column -->
      <template #cell-county="{ item }">
        {{ item.preferredCounty?.name || 'N/A' }}
      </template>

      <!-- Status Column -->
      <template #cell-status="{ item }">
        <Badge :variant="getStatusBadgeVariant(item.status)">
          {{ formatStatus(item.status) }}
        </Badge>
      </template>

      <!-- Registration Date Column -->
      <template #cell-registrationDate="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>

      <!-- Actions Column -->
      <template #cell-actions="{ item }">
        <Button
          variant="secondary"
          size="sm"
          @click="viewAgent(item.id)"
          class="w-full sm:w-auto"
        >
          View
        </Button>
      </template>
    </Table>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import Select from '@/components/common/Select.vue';
import Table from '@/components/common/Table.vue';
import type { TableColumn } from '@/components/common/Table.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Avatar from '@/components/common/Avatar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import StatCard from '@/components/admin/StatCard.vue';

const router = useRouter();

// Table columns configuration
const tableColumns: TableColumn[] = [
  { key: 'agent', label: 'Agent' },
  {
    key: 'contact',
    label: 'Contact',
    className: 'hidden lg:table-cell',
    cellClassName: 'hidden lg:table-cell',
  },
  {
    key: 'county',
    label: 'County',
    className: 'hidden md:table-cell',
    cellClassName: 'hidden md:table-cell',
  },
  { key: 'status', label: 'Status' },
  {
    key: 'registrationDate',
    label: 'Registration Date',
    className: 'hidden sm:table-cell',
    cellClassName: 'hidden sm:table-cell',
  },
  { key: 'actions', label: 'Actions', align: 'right' },
];

interface Observer {
  id: string;
  nationalId: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  preferredCounty?: { name: string };
  profilePhotoUrl?: string;
}

interface ObserverStats {
  total: number;
  active: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  inactive: number;
  assigned: number;
  unassigned: number;
  recentRegistrations: number;
  recentApprovals: number;
}

// Reactive data
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref('');
const viewMode = ref('agents');

const agents = ref<Observer[]>([]);
const stats = ref<ObserverStats>({
  total: 0,
  active: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  suspended: 0,
  inactive: 0,
  assigned: 0,
  unassigned: 0,
  recentRegistrations: 0,
  recentApprovals: 0,
});

// Pagination state
const currentPage = ref(1);
const perPage = ref(10);

// Filter options
interface SelectOption {
  value: string | number;
  label: string;
}

const statusOptions = computed(() => [
  { value: '', label: 'All Statuses' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'more_information_requested', label: 'More Information Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
]);

const viewModeOptions = computed(() => [
  { value: 'agents', label: 'Show Agents' },
  { value: 'applications', label: 'Show Applications' },
]);

// Computed properties
const filteredAgents = computed(() => {
  let filtered = agents.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (agent) =>
        agent.firstName.toLowerCase().includes(query) ||
        agent.lastName.toLowerCase().includes(query) ||
        (agent.email ?? '').toLowerCase().includes(query) ||
        agent.nationalId.toLowerCase().includes(query) ||
        agent.phoneNumber?.toLowerCase().includes(query)
    );
  }

  if (statusFilter.value) {
    filtered = filtered.filter(
      (agent) => agent.status === statusFilter.value
    );
  }

  return filtered;
});

// Methods
const loadAgents = async () => {
  loading.value = true;
  error.value = null;
  currentPage.value = 1; // Reset to first page when reloading

  try {
    // Load agents data
    const agentsResponse = await api.get('/admin/observers', {
      params: {
        page: currentPage.value,
        limit: perPage.value,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    });

    agents.value = agentsResponse.data.data;

    // Load stats data
    const statsResponse = await api.get('/admin/observers/stats');
    stats.value = statsResponse.data.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load agents';
    console.error('Error loading agents:', err);
  } finally {
    loading.value = false;
  }
};

const exportAgents = async () => {
  try {
    const response = await api.get('/admin/observers/export', {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'agents.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting agents:', err);
    error.value = 'Failed to export agents';
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  viewMode.value = 'agents';
  currentPage.value = 1; // Reset to first page when resetting filters
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  currentPage.value = 1; // Reset to first page when changing per page
};

const viewAgent = (id: string) => {
  router.push(`/admin/observers/${id}`);
};

const getStatusBadgeVariant = (
  status: string
): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
  const variants: Record<
    string,
    'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  > = {
    pending_review: 'warning',
    more_information_requested: 'warning',
    approved: 'success',
    active: 'primary',
    rejected: 'danger',
    suspended: 'secondary',
    inactive: 'secondary',
  };
  return variants[status] || 'secondary';
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

// Lifecycle
onMounted(() => {
  loadAgents();
});
</script>

<style scoped>
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
