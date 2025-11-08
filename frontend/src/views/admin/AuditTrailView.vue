<template>
  <MainLayout
    page-title="Access Audit Trail"
    page-description="View all permission checks and access control decisions"
  >
    <!-- Filters -->
    <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- User Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            User
          </label>
          <input
            v-model="filters.userId"
            type="text"
            class="form-input"
            placeholder="User UUID"
          />
        </div>

        <!-- Resource Type Filter -->
        <Select
          v-model="filters.resourceType"
          :options="resourceTypeOptions"
          label="Resource Type"
          placeholder="All Resources"
        />

        <!-- Action Filter -->
        <Select
          v-model="filters.action"
          :options="actionOptions"
          label="Action"
          placeholder="All Actions"
        />

        <!-- Result Filter -->
        <Select
          v-model="filters.granted"
          :options="resultOptions"
          label="Result"
          placeholder="All Results"
        />
      </div>

      <div class="flex justify-between items-center mt-4">
        <!-- Date Range -->
        <div class="flex gap-2">
          <input v-model="filters.startDate" type="date" class="form-input" />
          <span class="self-center text-gray-500">to</span>
          <input v-model="filters.endDate" type="date" class="form-input" />
        </div>

        <!-- Apply Filters Button -->
        <Button variant="primary" @click="loadAuditTrail">
          Apply Filters
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="auditLogs.length === 0"
      title="No audit logs found"
      description="No permission checks match your filters"
    />

    <!-- Audit Logs Table -->
    <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Timestamp
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                User
              </th>
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
                Result
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Reason
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"
              >
                Duration
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {{ formatTimestamp(log.createdAt) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ log.user?.firstName }} {{ log.user?.lastName }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ log.user?.email }}
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <Badge :variant="getResourceColor(log.resourceType)">
                  {{ formatResourceType(log.resourceType) }}
                </Badge>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <Badge variant="secondary">
                  {{ log.action }}
                </Badge>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <Badge :variant="log.granted ? 'success' : 'danger'">
                  {{ log.granted ? 'Granted' : 'Denied' }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">
                <span v-if="log.denialReason" class="text-red-600">
                  {{ log.denialReason }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td
                class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500"
              >
                {{ log.evaluationTimeMs }}ms
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="px-6 py-4 border-t border-gray-200 flex justify-between items-center"
      >
        <div class="text-sm text-gray-500">
          Showing {{ auditLogs.length }} results
        </div>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            :disabled="pagination.page === 1"
            @click="previousPage"
          >
            Previous
          </Button>
          <Button variant="secondary" size="sm" @click="nextPage">
            Next
          </Button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import Select from '@/components/common/Select.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import EmptyState from '@/components/common/EmptyState.vue';

interface AuditLog {
  id: string;
  userId: string;
  resourceType: string;
  action: string;
  granted: boolean;
  denialReason?: string;
  evaluationTimeMs: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const auditLogs = ref<AuditLog[]>([]);
const loading = ref(false);

const filters = ref({
  userId: '',
  resourceType: '',
  action: '',
  granted: '',
  startDate: '',
  endDate: '',
});

const pagination = ref({
  page: 1,
  limit: 50,
});

// Filter options
const resourceTypeOptions = [
  { value: '', label: 'All Resources' },
  { value: 'election', label: 'Elections' },
  { value: 'election_result', label: 'Results' },
  { value: 'candidate', label: 'Candidates' },
  { value: 'user', label: 'Users' },
];

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'read', label: 'Read' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'verify', label: 'Verify' },
];

const resultOptions = [
  { value: '', label: 'All Results' },
  { value: 'true', label: 'Granted' },
  { value: 'false', label: 'Denied' },
];

async function loadAuditTrail() {
  loading.value = true;

  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };

    if (filters.value.userId) params.userId = filters.value.userId;
    if (filters.value.resourceType)
      params.resourceType = filters.value.resourceType;
    if (filters.value.action) params.action = filters.value.action;
    if (filters.value.granted !== '')
      params.granted = filters.value.granted === 'true';
    if (filters.value.startDate) params.startDate = filters.value.startDate;
    if (filters.value.endDate) params.endDate = filters.value.endDate;

    const response = await api.get('/permissions/audit', { params });
    auditLogs.value = response.data.data;
  } catch (err) {
    console.error('Failed to load audit trail:', err);
  } finally {
    loading.value = false;
  }
}

function previousPage() {
  if (pagination.value.page > 1) {
    pagination.value.page--;
    loadAuditTrail();
  }
}

function nextPage() {
  pagination.value.page++;
  loadAuditTrail();
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
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
  loadAuditTrail();
});
</script>
