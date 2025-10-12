<template>
  <MainLayout
    page-title="Users Overview"
    page-description="Manage and monitor all system users"
  >
    <!-- Search and Filters -->
    <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <SearchBar
            v-model="searchQuery"
            placeholder="Search by name, email, phone, or ID..."
          />
        </div>

        <!-- Role Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select v-model="filters.role" class="form-input">
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="election_manager">Election Manager</option>
            <option value="field_observer">Field Observer</option>
            <option value="public_viewer">Public Viewer</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select v-model="filters.isActive" class="form-input">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Registration Status Filter -->
      <div class="mt-4 flex gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Registration Status
          </label>
          <select v-model="filters.registrationStatus" class="form-input">
            <option value="">All Registration Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex items-end gap-2">
          <Button variant="secondary" @click="resetFilters">
            Reset Filters
          </Button>
          <Button variant="primary" @click="loadUsers"> Apply Filters </Button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white shadow-sm rounded-lg p-4">
        <div class="text-sm text-gray-600">Total Users</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">
          {{ stats.total }}
        </div>
      </div>
      <div class="bg-white shadow-sm rounded-lg p-4">
        <div class="text-sm text-gray-600">Active</div>
        <div class="text-2xl font-bold text-green-600 mt-1">
          {{ stats.active }}
        </div>
      </div>
      <div class="bg-white shadow-sm rounded-lg p-4">
        <div class="text-sm text-gray-600">Pending Approval</div>
        <div class="text-2xl font-bold text-yellow-600 mt-1">
          {{ stats.pending }}
        </div>
      </div>
      <div class="bg-white shadow-sm rounded-lg p-4">
        <div class="text-sm text-gray-600">Observers</div>
        <div class="text-2xl font-bold text-primary-600 mt-1">
          {{ stats.observers }}
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
    <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              User
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Contact
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Role
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Status
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Geographic Scope
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              Last Login
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4">
              <div class="flex items-center">
                <Avatar :user="user" size="md" color="primary" />
                <div class="ml-3">
                  <div class="text-sm font-medium text-gray-900">
                    {{ user.firstName }} {{ user.lastName }}
                  </div>
                  <div class="text-sm text-gray-500">
                    ID: {{ user.nationalId }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">{{ user.email }}</div>
              <div class="text-sm text-gray-500">
                {{ user.phoneNumber || 'N/A' }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <Badge :variant="getRoleBadgeVariant(user.role)">
                {{ formatRole(user.role) }}
              </Badge>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <Badge :variant="user.isActive ? 'success' : 'secondary'">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </Badge>
              <Badge
                v-if="user.registrationStatus !== 'approved'"
                :variant="getRegistrationBadgeVariant(user.registrationStatus)"
                class="ml-1"
              >
                {{ formatRegistrationStatus(user.registrationStatus) }}
              </Badge>
            </td>
            <td class="px-6 py-4">
              <div
                v-if="user.scopes && user.scopes.length > 0"
                class="space-y-1"
              >
                <Badge
                  v-for="scope in user.scopes.slice(0, 2)"
                  :key="scope.id"
                  variant="secondary"
                  size="sm"
                >
                  {{ getScopeLabel(scope) }}
                </Badge>
                <div
                  v-if="user.scopes.length > 2"
                  class="text-xs text-gray-500"
                >
                  +{{ user.scopes.length - 2 }} more
                </div>
              </div>
              <span v-else class="text-sm text-gray-400">No restrictions</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ user.lastLogin ? formatDate(user.lastLogin) : 'Never' }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <div class="flex justify-end gap-2">
                <button
                  @click="viewUserDetails(user)"
                  class="text-primary-600 hover:text-primary-900"
                  title="View Details"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
                <button
                  v-if="user.role !== 'super_admin'"
                  @click="toggleUserStatus(user)"
                  :class="
                    user.isActive
                      ? 'text-gray-600 hover:text-gray-900'
                      : 'text-green-600 hover:text-green-900'
                  "
                  :title="user.isActive ? 'Deactivate' : 'Activate'"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      v-if="user.isActive"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        class="px-6 py-4 border-t border-gray-200 flex justify-between items-center"
      >
        <div class="text-sm text-gray-500">
          Showing {{ filteredUsers.length }} of {{ users.length }} users
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <UserDetailsModal v-model="showDetailsModal" :user="selectedUser" />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Avatar from '@/components/common/Avatar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import UserDetailsModal from '@/components/admin/UserDetailsModal.vue';

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

const showDetailsModal = ref(false);
const selectedUser = ref<User | null>(null);

const stats = computed(() => ({
  total: users.value.length,
  active: users.value.filter((u) => u.isActive).length,
  pending: users.value.filter(
    (u) => u.registrationStatus === 'pending_approval'
  ).length,
  observers: users.value.filter((u) => u.role === 'field_observer').length,
}));

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

function resetFilters() {
  searchQuery.value = '';
  filters.value = {
    role: '',
    isActive: '',
    registrationStatus: '',
  };
}

function getRoleBadgeVariant(role: string): string {
  const variants: Record<string, string> = {
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

function getRegistrationBadgeVariant(status: string): string {
  const variants: Record<string, string> = {
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return variants[status] || 'secondary';
}

function formatRegistrationStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getScopeLabel(scope: any): string {
  if (scope.scopeLevel === 'national') return 'National';
  if (scope.county) return scope.county.name;
  if (scope.constituency) return scope.constituency.name;
  if (scope.ward) return scope.ward.name;
  return scope.scopeLevel;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

onMounted(() => {
  loadUsers();
});
</script>
