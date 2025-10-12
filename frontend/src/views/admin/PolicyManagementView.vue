<template>
  <MainLayout
    page-title="Policy Management"
    page-description="Manage ABAC access control policies"
  >
    <!-- Actions Bar -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
      <!-- Search and Filters -->
      <div class="flex flex-wrap gap-3">
        <SearchBar
          v-model="searchQuery"
          placeholder="Search policies..."
          class="w-full sm:w-64"
        />

        <select v-model="filters.isActive" class="form-input w-full sm:w-auto">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>

        <select
          v-model="filters.resourceType"
          class="form-input w-full sm:w-auto"
        >
          <option value="">All Resources</option>
          <option value="election">Elections</option>
          <option value="election_result">Results</option>
          <option value="candidate">Candidates</option>
          <option value="user">Users</option>
        </select>
      </div>

      <!-- Create Button -->
      <Button variant="primary" @click="showCreateModal = true">
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
        Create Policy
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" type="error" :message="error" class="mb-4" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="filteredPolicies.length === 0"
      title="No policies found"
      description="Create your first access control policy to get started"
      icon="shield"
    >
      <Button variant="primary" @click="showCreateModal = true">
        Create Policy
      </Button>
    </EmptyState>

    <!-- Policy List -->
    <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Policy Name
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Resource
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Effect
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Priority
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
            v-for="policy in filteredPolicies"
            :key="policy.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4">
              <div class="text-sm font-medium text-gray-900">
                {{ policy.name }}
              </div>
              <div v-if="policy.description" class="text-sm text-gray-500 mt-1">
                {{ policy.description }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <Badge :variant="getResourceColor(policy.resourceType)">
                {{ formatResourceType(policy.resourceType) }}
              </Badge>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="action in policy.actions"
                  :key="action"
                  variant="secondary"
                  size="sm"
                >
                  {{ action }}
                </Badge>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <Badge
                :variant="policy.effect === 'allow' ? 'success' : 'danger'"
              >
                {{ policy.effect }}
              </Badge>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ policy.priority }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <Badge :variant="policy.isActive ? 'success' : 'secondary'">
                {{ policy.isActive ? 'Active' : 'Disabled' }}
              </Badge>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <div class="flex justify-end gap-2">
                <button
                  @click="togglePolicy(policy)"
                  class="text-gray-600 hover:text-gray-900"
                  :title="policy.isActive ? 'Disable' : 'Enable'"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      v-if="policy.isActive"
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
                <button
                  @click="editPolicy(policy)"
                  class="text-primary-600 hover:text-primary-900"
                  title="Edit"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  @click="deletePolicy(policy)"
                  class="text-danger-600 hover:text-danger-900"
                  title="Delete"
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
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Policy Modal -->
    <PolicyFormModal
      v-model="showCreateModal"
      :policy="selectedPolicy"
      @saved="handlePolicySaved"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import PolicyFormModal from '@/components/admin/PolicyFormModal.vue';

interface Policy {
  id: string;
  name: string;
  description?: string;
  effect: 'allow' | 'deny';
  priority: number;
  roles: string[];
  resourceType: string;
  actions: string[];
  conditions?: any;
  isActive: boolean;
  createdAt: string;
}

const policies = ref<Policy[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const filters = ref({
  isActive: '',
  resourceType: '',
});

const showCreateModal = ref(false);
const selectedPolicy = ref<Policy | null>(null);

const filteredPolicies = computed(() => {
  let result = policies.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (filters.value.isActive !== '') {
    const isActive = filters.value.isActive === 'true';
    result = result.filter((p) => p.isActive === isActive);
  }

  // Resource type filter
  if (filters.value.resourceType) {
    result = result.filter(
      (p) => p.resourceType === filters.value.resourceType
    );
  }

  return result;
});

async function loadPolicies() {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get('/policies');
    policies.value = response.data.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load policies';
  } finally {
    loading.value = false;
  }
}

async function togglePolicy(policy: Policy) {
  try {
    await api.patch(`/policies/${policy.id}/toggle`);
    policy.isActive = !policy.isActive;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to toggle policy';
  }
}

function editPolicy(policy: Policy) {
  selectedPolicy.value = policy;
  showCreateModal.value = true;
}

async function deletePolicy(policy: Policy) {
  if (!confirm(`Are you sure you want to delete policy "${policy.name}"?`)) {
    return;
  }

  try {
    await api.delete(`/policies/${policy.id}`);
    await loadPolicies();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete policy';
  }
}

function handlePolicySaved() {
  showCreateModal.value = false;
  selectedPolicy.value = null;
  loadPolicies();
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
  loadPolicies();
});
</script>
