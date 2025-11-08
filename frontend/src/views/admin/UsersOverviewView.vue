<template>
  <MainLayout
    page-title="Users Overview"
    page-description="Manage and monitor all system users"
  >
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Approved Users"
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
        title="Field Observers"
        :value="stats.observers"
        :percentage="
          stats.total > 0 ? (stats.observers / stats.total) * 100 : 0
        "
        icon="check-circle"
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
          <!-- Role Filter -->
          <Select
            v-model="filters.role"
            label="Role"
            placeholder="All Roles"
            :options="roleOptions"
          />

          <!-- Status Filter -->
          <Select
            v-model="filters.isActive"
            label="Status"
            placeholder="All Status"
            :options="statusOptions"
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
          <Button variant="primary" @click="loadUsers" class="w-full sm:w-auto">
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
      v-else-if="filteredUsers.length === 0"
      title="No users found"
      description="No users match your search criteria"
    />

    <!-- Users Table -->
    <Table
      v-else
      :columns="tableColumns"
      :data="filteredUsers"
      :current-page="currentPage"
      :per-page="perPage"
      @page-change="currentPage = $event"
      @per-page-change="handlePerPageChange"
    >
      <!-- User Column -->
      <template #cell-user="{ item }">
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
              <Badge :variant="getRoleBadgeVariant(item.role)" size="sm">
                {{ formatRole(item.role) }}
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

      <!-- Role Column -->
      <template #cell-role="{ item }">
        <Badge :variant="getRoleBadgeVariant(item.role)">
          {{ formatRole(item.role) }}
        </Badge>
      </template>

      <!-- Status Column -->
      <template #cell-status="{ item }">
        <Badge :variant="item.isActive ? 'success' : 'secondary'">
          {{ item.isActive ? 'Active' : 'Inactive' }}
        </Badge>
        <Badge
          v-if="item.registrationStatus !== 'approved'"
          :variant="getRegistrationBadgeVariant(item.registrationStatus)"
          class="ml-1"
        >
          {{ formatRegistrationStatus(item.registrationStatus) }}
        </Badge>
      </template>

      <!-- Geographic Scope Column -->
      <template #cell-scope="{ item }">
        <div v-if="item.scopes && item.scopes.length > 0" class="space-y-1">
          <Badge
            v-for="scope in item.scopes.slice(0, 2)"
            :key="scope.id"
            variant="secondary"
            size="sm"
          >
            {{ getScopeLabel(scope) }}
          </Badge>
          <div v-if="item.scopes.length > 2" class="text-xs text-gray-500">
            +{{ item.scopes.length - 2 }} more
          </div>
        </div>
        <span v-else class="text-sm text-gray-400">No restrictions</span>
      </template>

      <!-- Last Login Column -->
      <template #cell-lastLogin="{ item }">
        {{ item.lastLogin ? formatDate(item.lastLogin) : 'Never' }}
      </template>

      <!-- Actions Column -->
      <template #cell-actions="{ item }">
        <Dropdown
          button-label="Actions"
          button-class="px-3 py-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
        >
          <DropdownItem @click="viewUserDetails(item)">
            View Details
          </DropdownItem>
          <DropdownItem @click="() => navigateToScopes(item.id)">
            Manage Scopes
          </DropdownItem>
          <DropdownItem @click="() => navigateToPermissions(item.id)">
            Manage Permissions
          </DropdownItem>
          <DropdownItem
            v-if="item.role !== 'super_admin'"
            @click="toggleUserStatus(item)"
            :variant="item.isActive ? 'danger' : 'default'"
          >
            {{ item.isActive ? 'Deactivate' : 'Activate' }}
          </DropdownItem>
        </Dropdown>
      </template>
    </Table>

    <!-- User Details Modal -->
    <UserDetailsModal v-model="showDetailsModal" :user="selectedUser" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';
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
import UserDetailsModal from '@/components/admin/UserDetailsModal.vue';

const router = useRouter();

// Table columns configuration
const tableColumns: TableColumn[] = [
  { key: 'user', label: 'User' },
  {
    key: 'contact',
    label: 'Contact',
    className: 'hidden lg:table-cell',
    cellClassName: 'hidden lg:table-cell',
  },
  { key: 'role', label: 'Role' },
  {
    key: 'status',
    label: 'Status',
    className: 'hidden sm:table-cell',
    cellClassName: 'hidden sm:table-cell',
  },
  {
    key: 'scope',
    label: 'Geographic Scope',
    className: 'hidden xl:table-cell',
    cellClassName: 'hidden xl:table-cell',
  },
  {
    key: 'lastLogin',
    label: 'Last Login',
    className: 'hidden md:table-cell',
    cellClassName: 'hidden md:table-cell',
  },
  { key: 'actions', label: 'Actions', align: 'right' },
];

interface User {
  id: string;
  nationalId: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  registrationStatus: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  scopes?: Array<{
    id: string;
    scopeLevel: string;
    county?: { name: string };
    constituency?: { name: string };
    ward?: { name: string };
  }>;
}

const users = ref<User[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const filters = ref({
  role: '',
  isActive: '',
  registrationStatus: '',
});

// Filter options
interface SelectOption {
  value: string | number;
  label: string;
}

// Pagination state
const currentPage = ref(1);
const perPage = ref(10);

const showDetailsModal = ref(false);
const selectedUser = ref<User | null>(null);

const stats = computed(() => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    // Total approved users
    total: users.value.filter((u) => u.registrationStatus === 'approved')
      .length,

    // Approved users who logged in within the last 1 day
    active: users.value.filter(
      (u) =>
        u.registrationStatus === 'approved' &&
        u.lastLogin &&
        new Date(u.lastLogin) >= oneDayAgo
    ).length,

    // Users with pending approval status
    pending: users.value.filter(
      (u) => u.registrationStatus === 'pending_approval'
    ).length,

    // Users with field_observer role
    observers: users.value.filter((u) => u.role === 'field_observer').length,
  };
});

const filteredUsers = computed(() => {
  let result = users.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (u) =>
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.nationalId.toLowerCase().includes(query) ||
        u.phoneNumber?.toLowerCase().includes(query)
    );
  }

  // Role filter
  if (filters.value.role) {
    result = result.filter((u) => u.role === filters.value.role);
  }

  // Active status filter
  if (filters.value.isActive !== '') {
    const isActive = filters.value.isActive === 'true';
    result = result.filter((u) => u.isActive === isActive);
  }

  // Registration status filter
  if (filters.value.registrationStatus) {
    result = result.filter(
      (u) => u.registrationStatus === filters.value.registrationStatus
    );
  }

  return result;
});

async function loadUsers() {
  loading.value = true;
  error.value = null;
  currentPage.value = 1; // Reset to first page when reloading

  try {
    const response = await api.get('/auth/users');
    users.value = response.data.data;

    // Load scopes for each user
    await loadUserScopes();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load users';
  } finally {
    loading.value = false;
  }
}

async function loadUserScopes() {
  // Load scopes for all users in parallel
  const scopePromises = users.value.map(async (user) => {
    try {
      const response = await api.get(`/users/${user.id}/scopes`);
      user.scopes = response.data.data;
    } catch (err) {
      user.scopes = [];
    }
  });

  await Promise.all(scopePromises);
}

async function toggleUserStatus(user: User) {
  const action = user.isActive ? 'deactivate' : 'activate';
  if (
    !confirm(
      `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`
    )
  ) {
    return;
  }

  try {
    // This endpoint would need to be created
    await api.patch(`/auth/users/${user.id}/status`, {
      isActive: !user.isActive,
    });
    user.isActive = !user.isActive;
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${action} user`;
  }
}

function viewUserDetails(user: User) {
  selectedUser.value = user;
  showDetailsModal.value = true;
}

function navigateToScopes(userId: string) {
  router.push('/admin/scopes');
  // Could pre-select this user if we enhance the scope management page
}

function navigateToPermissions(userId: string) {
  router.push('/admin/permissions');
  // Could pre-select this user if we enhance the permission management page
}

function handlePerPageChange(newPerPage: number) {
  perPage.value = newPerPage;
  currentPage.value = 1; // Reset to first page when changing per page
}

function resetFilters() {
  searchQuery.value = '';
  filters.value = {
    role: '',
    isActive: '',
    registrationStatus: '',
  };
  currentPage.value = 1; // Reset to first page when resetting filters
}

function getRoleBadgeVariant(
  role: string
): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  const variants: Record<
    string,
    'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  > = {
    super_admin: 'danger',
    election_manager: 'primary',
    field_observer: 'success',
    public_viewer: 'secondary',
  };
  return variants[role] || 'secondary';
}

function formatRole(role: string): string {
  const roles: Record<string, string> = {
    super_admin: 'Super Admin',
    election_manager: 'Election Manager',
    field_observer: 'Field Observer',
    public_viewer: 'Public Viewer',
  };
  return roles[role] || role;
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

// Computed properties to dynamically generate options from API data
const roleOptions = computed(() => {
  const uniqueRoles = [...new Set(users.value.map((user) => user.role))];
  return uniqueRoles
    .map((role) => ({
      value: role,
      label: formatRole(role),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const statusOptions = computed(() => [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]);

const registrationStatusOptions = computed(() => {
  const uniqueStatuses = [
    ...new Set(users.value.map((user) => user.registrationStatus)),
  ];
  return uniqueStatuses
    .map((status) => ({
      value: status,
      label: formatRegistrationStatus(status),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

function getScopeLabel(scope: any): string {
  if (scope.scopeLevel === 'national') return 'National';
  if (scope.county) return scope.county.name;
  if (scope.constituency) return scope.constituency.name;
  if (scope.ward) return scope.ward.name;
  return scope.scopeLevel;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

onMounted(() => {
  loadUsers();
});
</script>
