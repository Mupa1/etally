<template>
  <MainLayout
    page-title="Permission Management"
    page-description="Grant and revoke user-specific permissions"
  >
    <!-- User Selection -->
    <div class="bg-white shadow-sm rounded-lg p-6 mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select User
      </label>
      <select
        v-model="selectedUserId"
        class="form-input w-full max-w-md"
        @change="loadUserPermissions"
      >
        <option value="">-- Select a user --</option>
        <option v-for="user in users" :key="user.id" :value="user.id">
          {{ user.firstName }} {{ user.lastName }} ({{ user.email ?? 'No email' }}) -
          {{ user.role }}
        </option>
      </select>
    </div>

    <!-- User Permissions -->
    <div v-if="selectedUserId" class="bg-white shadow-sm rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Current Permissions</h2>
        <Button variant="primary" size="sm" @click="showGrantModal = true">
          Grant Permission
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="userPermissions.length === 0"
        title="No special permissions"
        description="This user has no user-specific permission overrides"
      >
        <Button variant="primary" size="sm" @click="showGrantModal = true">
          Grant First Permission
        </Button>
      </EmptyState>

      <!-- Permissions Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Resource
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Action
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Effect
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Expires
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Granted
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="permission in userPermissions"
              :key="permission.id"
              :class="{ 'opacity-50': isExpired(permission.expiresAt) }"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <Badge :variant="getResourceColor(permission.resourceType)">
                  {{ formatResourceType(permission.resourceType) }}
                </Badge>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <Badge variant="secondary">
                  {{ permission.action }}
                </Badge>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <Badge
                  :variant="
                    permission.effect === 'allow' ? 'success' : 'danger'
                  "
                >
                  {{ permission.effect }}
                </Badge>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <span v-if="permission.expiresAt">
                  {{ formatDate(permission.expiresAt) }}
                  <span
                    v-if="isExpired(permission.expiresAt)"
                    class="text-red-600"
                  >
                    (Expired)
                  </span>
                </span>
                <span v-else class="text-gray-400">Never</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(permission.createdAt) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right">
                <button
                  @click="revokePermission(permission.id)"
                  class="text-danger-600 hover:text-danger-900"
                  title="Revoke permission"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cleanup Expired Button -->
      <div
        v-if="hasExpiredPermissions"
        class="mt-4 pt-4 border-t border-gray-200"
      >
        <Button variant="secondary" size="sm" @click="cleanupExpired">
          Remove Expired Permissions
        </Button>
      </div>
    </div>

    <!-- Grant Permission Modal -->
    <GrantPermissionModal
      v-model="showGrantModal"
      :user-id="selectedUserId"
      @granted="handlePermissionGranted"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import GrantPermissionModal from '@/components/admin/GrantPermissionModal.vue';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Permission {
  id: string;
  resourceType: string;
  action: string;
  effect: 'allow' | 'deny';
  expiresAt?: string;
  createdAt: string;
}

const users = ref<User[]>([]);
const selectedUserId = ref('');
const userPermissions = ref<Permission[]>([]);
const loading = ref(false);
const showGrantModal = ref(false);

const hasExpiredPermissions = computed(() =>
  userPermissions.value.some((p) => p.expiresAt && isExpired(p.expiresAt))
);

async function loadUsers() {
  try {
    const response = await api.get('/auth/users');
    users.value = response.data.data;
  } catch (err) {
    console.error('Failed to load users:', err);
    users.value = [];
  }
}

async function loadUserPermissions() {
  if (!selectedUserId.value) return;

  loading.value = true;

  try {
    const response = await api.get(
      `/users/${selectedUserId.value}/permissions`
    );
    userPermissions.value = response.data.data;
  } catch (err) {
    console.error('Failed to load user permissions:', err);
  } finally {
    loading.value = false;
  }
}

async function revokePermission(permissionId: string) {
  if (!confirm('Are you sure you want to revoke this permission?')) return;

  try {
    await api.delete(`/permissions/${permissionId}`);
    await loadUserPermissions();
  } catch (err) {
    console.error('Failed to revoke permission:', err);
  }
}

async function cleanupExpired() {
  try {
    await api.post('/permissions/cleanup');
    await loadUserPermissions();
  } catch (err) {
    console.error('Failed to cleanup expired permissions:', err);
  }
}

function handlePermissionGranted() {
  showGrantModal.value = false;
  loadUserPermissions();
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function getResourceColor(resourceType: string): string {
  const colors: Record<string, string> = {
    election: 'primary',
    election_result: 'success',
    candidate: 'warning',
    user: 'danger',
    incident: 'secondary',
  };
  return colors[resourceType] || 'secondary';
}

function formatResourceType(resourceType: string): string {
  return resourceType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

onMounted(() => {
  loadUsers();
});
</script>
