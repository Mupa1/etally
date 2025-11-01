<template>
  <MainLayout
    page-title="Observer Management"
    page-description="Manage field observers, review applications, and monitor observer activities"
  >
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Observers"
        :value="stats.total || 0"
        icon="users"
        color="primary"
      />
      <StatCard
        title="Active Observers"
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
        title="Assigned Observers"
        :value="stats.assigned || 0"
        :percentage="stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0"
        icon="location"
        color="primary"
      />
    </div>

    <!-- Search and Filters -->
    <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
      <!-- Mobile: Stack all filters vertically -->
      <div class="space-y-4 md:space-y-0">
        <!-- Search - Full width on mobile, half on desktop -->
        <div class="w-full">
          <SearchBar
            v-model="searchQuery"
            placeholder="Search by name, email, phone, or ID..."
          />
        </div>

        <!-- Filters Grid - Stack on mobile, grid on desktop -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Status Filter -->
          <Select
            v-model="statusFilter"
            label="Status"
            placeholder="All Statuses"
            :options="statusOptions"
          />

          <!-- View Toggle Filter -->
          <Select
            v-model="viewMode"
            label="View Mode"
            placeholder="Select View"
            :options="viewModeOptions"
          />
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
            @click="loadObservers"
            class="w-full sm:w-auto"
            :disabled="loading"
          >
            <i class="icon-refresh mr-2" :class="{ spinning: loading }"></i>
            Refresh
          </Button>
          <Button
            variant="primary"
            @click="exportObservers"
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
      v-else-if="filteredObservers.length === 0"
      title="No observers found"
      description="No observers match your search criteria"
    />

    <!-- Observers Table -->
    <Table
      v-else
      :columns="tableColumns"
      :data="filteredObservers"
      :current-page="currentPage"
      :per-page="perPage"
      @page-change="currentPage = $event"
      @per-page-change="handlePerPageChange"
    >
      <!-- Observer Column -->
      <template #cell-observer="{ item }">
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
        <Dropdown
          button-label="Actions"
          button-class="px-3 py-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
        >
          <DropdownItem @click="viewObserver(item.id)">
            View Details
          </DropdownItem>
          <DropdownItem @click="assignStation(item.id)">
            Assign Station
          </DropdownItem>
          <DropdownItem
            v-if="item.status !== 'active'"
            @click="activateObserver(item.id)"
          >
            Activate
          </DropdownItem>
        </Dropdown>
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
import Dropdown from '@/components/common/Dropdown.vue';
import DropdownItem from '@/components/common/DropdownItem.vue';
import Badge from '@/components/common/Badge.vue';
import Avatar from '@/components/common/Avatar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import StatCard from '@/components/admin/StatCard.vue';

const router = useRouter();

// Table columns configuration
const tableColumns: TableColumn[] = [
  { key: 'observer', label: 'Observer' },
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
const viewMode = ref('observers');

const observers = ref<Observer[]>([]);
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
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
]);

const viewModeOptions = computed(() => [
  { value: 'observers', label: 'Show Observers' },
  { value: 'applications', label: 'Show Applications' },
]);

// Computed properties
const filteredObservers = computed(() => {
  let filtered = observers.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (observer) =>
        observer.firstName.toLowerCase().includes(query) ||
        observer.lastName.toLowerCase().includes(query) ||
        observer.email.toLowerCase().includes(query) ||
        observer.nationalId.toLowerCase().includes(query) ||
        observer.phoneNumber?.toLowerCase().includes(query)
    );
  }

  if (statusFilter.value) {
    filtered = filtered.filter(
      (observer) => observer.status === statusFilter.value
    );
  }

  return filtered;
});

// Methods
const loadObservers = async () => {
  loading.value = true;
  error.value = null;
  currentPage.value = 1; // Reset to first page when reloading

  try {
    // Load observers data
    const observersResponse = await api.get('/admin/observers', {
      params: {
        page: currentPage.value,
        limit: perPage.value,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    });

    observers.value = observersResponse.data.data;

    // Load stats data
    const statsResponse = await api.get('/admin/observers/stats');
    stats.value = statsResponse.data.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load observers';
    console.error('Error loading observers:', err);
  } finally {
    loading.value = false;
  }
};

const exportObservers = async () => {
  try {
    const response = await api.get('/admin/observers/export', {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'observers.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting observers:', err);
    error.value = 'Failed to export observers';
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  viewMode.value = 'observers';
  currentPage.value = 1; // Reset to first page when resetting filters
};

const handlePerPageChange = (newPerPage: number) => {
  perPage.value = newPerPage;
  currentPage.value = 1; // Reset to first page when changing per page
};

const viewObserver = (id: string) => {
  router.push(`/admin/observers/${id}`);
};

const assignStation = async (id: string) => {
  // TODO: Implement station assignment
  alert(`Assign station to observer ${id}`);
};

const activateObserver = async (id: string) => {
  if (!confirm('Are you sure you want to activate this observer?')) {
    return;
  }

  try {
    // TODO: Implement observer activation via API
    await api.put(`/admin/observers/${id}`, {
      status: 'active',
    });

    // Refresh the observers list
    await loadObservers();
  } catch (err: any) {
    console.error('Error activating observer:', err);
    error.value = err.response?.data?.message || 'Failed to activate observer';
  }
};

const getStatusBadgeVariant = (
  status: string
): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
  const variants: Record<
    string,
    'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  > = {
    pending_review: 'warning',
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
  loadObservers();
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
