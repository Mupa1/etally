<template>
  <MainLayout
    page-title="Geographic Scope Management"
    page-description="Assign users to geographic regions for access control"
  >
    <!-- User Selection -->
    <div class="bg-white shadow-sm rounded-lg p-6 mb-6">
      <Select
        v-model="selectedUserId"
        :options="userOptions"
        label="Select User"
        placeholder="-- Select a user --"
        class="w-full max-w-md"
        @update:model-value="loadUserScopes"
      />
    </div>

    <!-- User Scopes -->
    <div v-if="selectedUserId" class="bg-white shadow-sm rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">
          Current Geographic Scopes
        </h2>
        <Button variant="primary" size="sm" @click="showAssignModal = true">
          Assign Scope
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="userScopes.length === 0"
        title="No scopes assigned"
        description="This user has no geographic scope restrictions"
      >
        <Button variant="primary" size="sm" @click="showAssignModal = true">
          Assign First Scope
        </Button>
      </EmptyState>

      <!-- Scopes List -->
      <div v-else class="space-y-3">
        <div
          v-for="scope in userScopes"
          :key="scope.id"
          class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
        >
          <div>
            <div class="flex items-center gap-2">
              <Badge :variant="getScopeLevelColor(scope.scopeLevel)">
                {{ formatScopeLevel(scope.scopeLevel) }}
              </Badge>
              <span class="text-sm font-medium text-gray-900">
                {{
                  scope.county?.name ||
                  scope.constituency?.name ||
                  scope.ward?.name ||
                  'National'
                }}
              </span>
            </div>
            <p v-if="scope.county" class="text-xs text-gray-500 mt-1">
              Code: {{ scope.county.code }}
            </p>
          </div>
          <button
            @click="removeScope(scope.id)"
            class="text-danger-600 hover:text-danger-900"
            title="Remove scope"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Assign Scope Modal -->
    <AssignScopeModal
      v-model="showAssignModal"
      :user-id="selectedUserId"
      @assigned="handleScopeAssigned"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import Select from '@/components/common/Select.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import AssignScopeModal from '@/components/admin/AssignScopeModal.vue';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Scope {
  id: string;
  scopeLevel: string;
  county?: { name: string; code: string };
  constituency?: { name: string };
  ward?: { name: string };
}

const users = ref<User[]>([]);
const selectedUserId = ref('');
const userScopes = ref<Scope[]>([]);
const loading = ref(false);
const showAssignModal = ref(false);

// Computed property for user options
const userOptions = computed(() => [
  { value: '', label: '-- Select a user --' },
  ...users.value.map((user) => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`,
  })),
]);

async function loadUsers() {
  try {
    // This would need a users list endpoint
    // For now, we'll use a placeholder
    const response = await api.get('/auth/users');
    users.value = response.data.data;
  } catch (err) {
    console.error('Failed to load users:', err);
    // Mock data for development
    users.value = [];
  }
}

async function loadUserScopes() {
  if (!selectedUserId.value) return;

  loading.value = true;

  try {
    const response = await api.get(`/users/${selectedUserId.value}/scopes`);
    userScopes.value = response.data.data;
  } catch (err) {
    console.error('Failed to load user scopes:', err);
  } finally {
    loading.value = false;
  }
}

async function removeScope(scopeId: string) {
  if (!confirm('Are you sure you want to remove this scope?')) return;

  try {
    await api.delete(`/scopes/${scopeId}`);
    await loadUserScopes();
  } catch (err) {
    console.error('Failed to remove scope:', err);
  }
}

function handleScopeAssigned() {
  showAssignModal.value = false;
  loadUserScopes();
}

function getScopeLevelColor(level: string): string {
  const colors: Record<string, string> = {
    national: 'primary',
    county: 'success',
    constituency: 'warning',
    ward: 'secondary',
  };
  return colors[level] || 'secondary';
}

function formatScopeLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

onMounted(() => {
  loadUsers();
});
</script>
