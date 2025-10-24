<template>
  <MainLayout
    page-title="Field Observers Management"
    page-description="Manage and monitor field observers for election monitoring"
  >
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Observers"
        :value="stats.total"
        icon="check"
        color="primary"
      />
      <StatCard
        title="Active (24h)"
        :value="stats.active"
        :percentage="stats.total > 0 ? (stats.active / stats.total) * 100 : 0"
        icon="check-circle"
        color="success"
      />
      <StatCard
        title="Pending Approval"
        :value="stats.pending"
        icon="clock"
        color="warning"
      />
      <StatCard
        title="Assigned Locations"
        :value="stats.assigned"
        :percentage="stats.total > 0 ? (stats.assigned / stats.total) * 100 : 0"
        icon="location"
        color="info"
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
            placeholder="Search by name, email, tracking number..."
          />
        </div>

        <!-- Filters Grid - Stack on mobile, grid on desktop -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <!-- Status Filter -->
          <Select
            v-model="filters.status"
            label="Status"
            placeholder="All Status"
            :options="statusOptions"
          />

          <!-- Location Filter -->
          <Select
            v-model="filters.location"
            label="Location"
            placeholder="All Locations"
            :options="locationOptions"
          />

          <!-- Registration Status Filter -->
          <Select
            v-model="filters.registrationStatus"
            label="Registration Status"
            placeholder="All Registration Status"
            :options="registrationStatusOptions"
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
          >
            Apply Filters
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
              ID: {{ item.trackingNumber }}
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
              <Badge
                :variant="item.isActive ? 'success' : 'secondary'"
                size="sm"
              >
                {{ item.isActive ? 'Active' : 'Inactive' }}
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

      <!-- Status Column -->
      <template #cell-status="{ item }">
        <Badge :variant="getStatusBadgeVariant(item.status)">
          {{ formatStatus(item.status) }}
        </Badge>
        <Badge
          v-if="item.registrationStatus !== 'approved'"
          :variant="getRegistrationBadgeVariant(item.registrationStatus)"
          class="ml-1"
        >
          {{ formatRegistrationStatus(item.registrationStatus) }}
        </Badge>
      </template>

      <!-- Location Column -->
      <template #cell-location="{ item }">
        <div v-if="item.location" class="text-sm text-gray-900">
          {{ item.location }}
        </div>
        <span v-else class="text-sm text-gray-400">Not assigned</span>
      </template>

      <!-- Last Activity Column -->
      <template #cell-lastActivity="{ item }">
        {{ item.lastActivity ? formatDate(item.lastActivity) : 'Never' }}
      </template>

      <!-- Actions Column -->
      <template #cell-actions="{ item }">
        <Dropdown
          button-label="Actions"
          button-class="px-3 py-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
        >
          <DropdownItem @click="viewObserverDetails(item)">
            View Details
          </DropdownItem>
          <DropdownItem @click="editObserver(item)">
            Edit Observer
          </DropdownItem>
          <DropdownItem @click="assignLocation(item)">
            Assign Location
          </DropdownItem>
          <DropdownItem
            @click="toggleObserverStatus(item)"
            :variant="item.isActive ? 'danger' : 'default'"
          >
            {{ item.isActive ? 'Deactivate' : 'Activate' }}
          </DropdownItem>
        </Dropdown>
      </template>
    </Table>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import Select from '@/components/common/Select.vue';
import Table from '@/components/common/Table.vue';
import type { TableColumn } from '@/components/common/Table.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import DropdownItem from '@/components/common/DropdownItem.vue';
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
  { key: 'observer', label: 'Observer' },
  {
    key: 'contact',
    label: 'Contact',
    className: 'hidden lg:table-cell',
    cellClassName: 'hidden lg:table-cell',
  },
  { key: 'status', label: 'Status' },
  {
    key: 'location',
    label: 'Location',
    className: 'hidden sm:table-cell',
    cellClassName: 'hidden sm:table-cell',
  },
  {
    key: 'lastActivity',
    label: 'Last Activity',
    className: 'hidden md:table-cell',
    cellClassName: 'hidden md:table-cell',
  },
  { key: 'actions', label: 'Actions', align: 'right' },
];

interface Observer {
  id: string;
  trackingNumber: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  status: string;
  registrationStatus: string;
  isActive: boolean;
  location?: string;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

const observers = ref<Observer[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const filters = ref({
  status: '',
  location: '',
  registrationStatus: '',
});

// Pagination state
const currentPage = ref(1);
const perPage = ref(10);

// Filter options
interface SelectOption {
  value: string | number;
  label: string;
}

const stats = computed(() => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    // Total observers
    total: observers.value.length,

    // Observers who were active within the last 1 day
    active: observers.value.filter(
      (o) =>
        o.isActive && o.lastActivity && new Date(o.lastActivity) >= oneDayAgo
    ).length,

    // Observers with pending approval status
    pending: observers.value.filter(
      (o) => o.registrationStatus === 'pending_approval'
    ).length,

    // Observers with assigned locations
    assigned: observers.value.filter((o) => o.location).length,
  };
});

const filteredObservers = computed(() => {
  let result = observers.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (o) =>
        o.firstName.toLowerCase().includes(query) ||
        o.lastName.toLowerCase().includes(query) ||
        o.email.toLowerCase().includes(query) ||
        o.trackingNumber.toLowerCase().includes(query) ||
        o.phoneNumber?.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (filters.value.status) {
    result = result.filter((o) => o.status === filters.value.status);
  }

  // Location filter
  if (filters.value.location) {
    result = result.filter(
      (o) => o.location?.toLowerCase() === filters.value.location.toLowerCase()
    );
  }

  // Registration status filter
  if (filters.value.registrationStatus) {
    result = result.filter(
      (o) => o.registrationStatus === filters.value.registrationStatus
    );
  }

  return result;
});

// Computed properties to dynamically generate options from API data
const statusOptions = computed(() => {
  const uniqueStatuses = [
    ...new Set(observers.value.map((observer) => observer.status)),
  ];
  return uniqueStatuses
    .map((status) => ({
      value: status,
      label: formatStatus(status),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const locationOptions = computed(() => {
  const uniqueLocations = [
    ...new Set(
      observers.value.map((observer) => observer.location).filter(Boolean)
    ),
  ];
  return uniqueLocations
    .map((location) => ({
      value: location,
      label: location,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const registrationStatusOptions = computed(() => {
  const uniqueStatuses = [
    ...new Set(observers.value.map((observer) => observer.registrationStatus)),
  ];
  return uniqueStatuses
    .map((status) => ({
      value: status,
      label: formatRegistrationStatus(status),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

async function loadObservers() {
  loading.value = true;
  error.value = null;
  currentPage.value = 1; // Reset to first page when reloading

  try {
    // Mock data - replace with actual API call
    observers.value = [
      {
        id: '1',
        trackingNumber: 'OBS001',
        email: 'john.doe@example.com',
        phoneNumber: '+254712345678',
        firstName: 'John',
        lastName: 'Doe',
        status: 'approved',
        registrationStatus: 'approved',
        isActive: true,
        location: 'Nairobi',
        lastActivity: '2024-01-20T14:45:00Z',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
      },
      {
        id: '2',
        trackingNumber: 'OBS002',
        email: 'jane.smith@example.com',
        phoneNumber: '+254723456789',
        firstName: 'Jane',
        lastName: 'Smith',
        status: 'pending',
        registrationStatus: 'pending_approval',
        isActive: false,
        location: 'Mombasa',
        lastActivity: '2024-01-19T16:20:00Z',
        createdAt: '2024-01-16T09:15:00Z',
        updatedAt: '2024-01-19T16:20:00Z',
      },
      {
        id: '3',
        trackingNumber: 'OBS003',
        email: 'michael.johnson@example.com',
        phoneNumber: '+254734567890',
        firstName: 'Michael',
        lastName: 'Johnson',
        status: 'active',
        registrationStatus: 'approved',
        isActive: true,
        location: 'Kisumu',
        lastActivity: '2024-01-20T12:30:00Z',
        createdAt: '2024-01-14T11:45:00Z',
        updatedAt: '2024-01-20T12:30:00Z',
      },
    ];
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load observers';
  } finally {
    loading.value = false;
  }
}

async function toggleObserverStatus(observer: Observer) {
  const action = observer.isActive ? 'deactivate' : 'activate';
  if (
    !confirm(
      `Are you sure you want to ${action} ${observer.firstName} ${observer.lastName}?`
    )
  ) {
    return;
  }

  try {
    // This endpoint would need to be created
    // await api.patch(`/observers/${observer.id}/status`, {
    //   isActive: !observer.isActive,
    // });
    observer.isActive = !observer.isActive;
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${action} observer`;
  }
}

function viewObserverDetails(observer: Observer) {
  // Navigate to observer details page
  router.push(`/admin/observers/${observer.id}`);
}

function editObserver(observer: Observer) {
  // Navigate to edit observer page
  router.push(`/admin/observers/${observer.id}/edit`);
}

function assignLocation(observer: Observer) {
  // Navigate to location assignment page
  router.push(`/admin/observers/${observer.id}/location`);
}

function handlePerPageChange(newPerPage: number) {
  perPage.value = newPerPage;
  currentPage.value = 1; // Reset to first page when changing per page
}

function resetFilters() {
  searchQuery.value = '';
  filters.value = {
    status: '',
    location: '',
    registrationStatus: '',
  };
  currentPage.value = 1; // Reset to first page when resetting filters
}

function getStatusBadgeVariant(
  status: string
): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  const variants: Record<
    string,
    'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  > = {
    approved: 'success',
    active: 'success',
    pending: 'warning',
    rejected: 'danger',
    inactive: 'secondary',
  };
  return variants[status] || 'secondary';
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    approved: 'Approved',
    active: 'Active',
    pending: 'Pending',
    rejected: 'Rejected',
    inactive: 'Inactive',
  };
  return statuses[status] || status;
}

function getRegistrationBadgeVariant(
  status: string
): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  const variants: Record<
    string,
    'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  > = {
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return variants[status] || 'secondary';
}

function formatRegistrationStatus(status?: string): string {
  if (!status) return 'N/A';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

onMounted(() => {
  loadObservers();
});
</script>
