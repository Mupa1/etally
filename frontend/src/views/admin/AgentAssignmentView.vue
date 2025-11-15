<template>
  <MainLayout
    page-title="Agent Assignment"
    page-description="Assign agents to polling stations and manage election assignments"
  >
    <!-- Header Actions -->
    <div class="mb-6 flex justify-end">
      <Button variant="primary" size="sm" @click="showAssignModal = true">
        Assign Agent
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Active Contests"
        :value="assignmentStats.totalActiveContests || 0"
        color="primary"
      />
      <StatCard
        title="Unassigned Stations"
        :value="assignmentStats.unassignedStations || 0"
        :color="assignmentStats.unassignedStations > 0 ? 'danger' : 'success'"
      />
      <StatCard
        title="Fully Assigned Contests"
        :value="assignmentStats.fullyAssignedContests || 0"
        color="success"
      />
      <div
        class="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center"
      >
        <p class="text-sm font-medium text-gray-600 mb-2">
          Assignment Progress
        </p>
        <ProgressGauge
          :percentage="assignmentStats.assignmentProgress || 0"
          :size="100"
          label="Overall"
        />
      </div>
    </div>

    <!-- Contest Progress Table -->
    <div
      v-if="assignmentStats.contests && assignmentStats.contests.length > 0"
      class="bg-white shadow-sm rounded-lg overflow-hidden mb-6"
    >
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Contest Progress</h3>
        <p class="text-sm text-gray-500 mt-1">
          Assignment status for each active contest
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Contest
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Election
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Total Stations
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Assigned
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Progress
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="contest in assignmentStats.contests"
              :key="contest.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ contest.positionName }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ contest.electionTitle }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ contest.electionCode }}
                </div>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900"
              >
                {{ contest.totalStations }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900"
              >
                {{ contest.assignedStations }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center justify-center">
                  <div class="w-24">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all"
                        :class="getProgressColor(contest.progress)"
                        :style="{
                          width: `${Math.min(contest.progress, 100)}%`,
                        }"
                      ></div>
                    </div>
                    <div class="text-xs text-center mt-1 text-gray-600">
                      {{ contest.progress.toFixed(1) }}%
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="
                    contest.isFullyAssigned
                      ? 'bg-success-100 text-success-800'
                      : 'bg-warning-100 text-warning-800'
                  "
                >
                  {{ contest.isFullyAssigned ? 'Complete' : 'In Progress' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Agents with Multiple Contests -->
    <div
      v-if="agentsWithMultipleContests.length > 0"
      class="bg-white shadow-sm rounded-lg overflow-hidden mb-6"
    >
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Agents with Multiple Contests
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              Agents assigned to more than one active contest
            </p>
          </div>
          <Badge
            variant="info"
            :label="`${agentsWithMultipleContests.length} agents`"
          />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Agent
              </th>
              <th
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Total Contests
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Contests
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="agent in agentsWithMultipleContests"
              :key="agent.observerId"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ agent.observer.firstName }} {{ agent.observer.lastName }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ agent.observer.email || agent.observer.phoneNumber }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <Badge variant="warning" :label="`${agent.totalContests}`" />
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="contest in agent.contests"
                    :key="contest.contestId"
                    variant="info"
                    size="sm"
                    :label="`${contest.contestName} (${contest.electionTitle})`"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by agent name, station..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Election
          </label>
          <select
            v-model="selectedElection"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Elections</option>
            <option
              v-for="election in elections"
              :key="election.id"
              :value="election.id"
            >
              {{ election.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            v-model="selectedStatus"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        <div class="flex items-end">
          <Button
            variant="secondary"
            size="sm"
            @click="loadAssignments"
            class="w-full"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
      ></div>
      <p class="mt-2 text-gray-600">Loading assignments...</p>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="danger" :message="error" class="mb-6" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="filteredAssignments.length === 0"
      title="No assignments found"
      description="No assignments match your search criteria"
    />

    <!-- Assignments Table -->
    <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Agent
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Polling Station
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Election
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Assignment Date
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
              v-for="assignment in filteredAssignments"
              :key="assignment.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ assignment.observer?.firstName }}
                      {{ assignment.observer?.lastName }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{
                        assignment.observer?.email ||
                        assignment.observer?.phoneNumber
                      }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ assignment.pollingStation?.name || 'N/A' }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ assignment.pollingStation?.ward?.name || '' }}
                  {{
                    assignment.pollingStation?.ward?.constituency?.name
                      ? `, ${assignment.pollingStation?.ward?.constituency?.name}`
                      : ''
                  }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ assignment.election?.name || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{
                  assignment.assignmentDate
                    ? formatDate(assignment.assignmentDate)
                    : 'N/A'
                }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="
                    assignment.status === 'assigned'
                      ? 'bg-success-100 text-success-800'
                      : 'bg-gray-100 text-gray-800'
                  "
                >
                  {{ assignment.status || 'Unassigned' }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <button
                  @click="editAssignment(assignment)"
                  class="text-primary-600 hover:text-primary-900 mr-4"
                >
                  Edit
                </button>
                <button
                  @click="removeAssignment(assignment.id)"
                  class="text-danger-600 hover:text-danger-900"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Assign Agent Modal (placeholder - to be implemented) -->
    <!-- <AssignAgentModal
      v-model="showAssignModal"
      @assigned="handleAssignmentCreated"
    /> -->
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import StatCard from '@/components/common/StatCard.vue';
import ProgressGauge from '@/components/common/ProgressGauge.vue';
import Button from '@/components/common/Button.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import Badge from '@/components/common/Badge.vue';
import api from '@/utils/api';

interface Assignment {
  id: string;
  observer?: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
  };
  pollingStation?: {
    name: string;
    ward?: {
      name: string;
      constituency?: {
        name: string;
      };
    };
  };
  election?: {
    name: string;
  };
  assignmentDate?: string;
  status?: string;
}

interface Election {
  id: string;
  name: string;
}

const loading = ref(false);
const statsLoading = ref(false);
const error = ref<string | null>(null);
const assignments = ref<Assignment[]>([]);
const elections = ref<Election[]>([]);
const assignmentStats = ref({
  totalActiveContests: 0,
  totalStationsInActiveContests: 0,
  assignedStations: 0,
  unassignedStations: 0,
  fullyAssignedContests: 0,
  assignmentProgress: 0,
  contests: [] as Array<{
    id: string;
    positionName: string;
    electionId: string;
    electionTitle: string;
    electionCode: string;
    totalStations: number;
    assignedStations: number;
    unassignedStations: number;
    progress: number;
    isFullyAssigned: boolean;
  }>,
});
const agentsWithMultipleContests = ref<
  Array<{
    observerId: string;
    observer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phoneNumber: string;
    };
    contests: Array<{
      contestId: string;
      contestName: string;
      electionId: string;
      electionTitle: string;
      pollingStationId: string;
      pollingStationName: string;
    }>;
    totalContests: number;
  }>
>([]);
const searchQuery = ref('');
const selectedElection = ref('');
const selectedStatus = ref('');
const showAssignModal = ref(false);

const filteredAssignments = computed(() => {
  let filtered = assignments.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (assignment) =>
        assignment.observer?.firstName?.toLowerCase().includes(query) ||
        assignment.observer?.lastName?.toLowerCase().includes(query) ||
        assignment.pollingStation?.name?.toLowerCase().includes(query) ||
        assignment.observer?.email?.toLowerCase().includes(query) ||
        assignment.observer?.phoneNumber?.includes(query)
    );
  }

  if (selectedElection.value) {
    // Note: Assignment.election may not have id, filter by name for now
    // TODO: Update assignment interface to include election id
    filtered = filtered.filter(
      (assignment) => assignment.election?.name === selectedElection.value
    );
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(
      (assignment) => assignment.status === selectedStatus.value
    );
  }

  return filtered;
});

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function loadAssignments() {
  loading.value = true;
  error.value = null;

  try {
    // Load assignments
    const assignmentsResponse = await api.get('/admin/observer-assignments');
    assignments.value = assignmentsResponse.data.data || [];

    // Load elections for filter
    const electionsResponse = await api.get('/elections');
    elections.value = electionsResponse.data.data || [];
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load assignments';
    console.error('Error loading assignments:', err);
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  statsLoading.value = true;
  try {
    const response = await api.get('/admin/observer-assignments/stats');
    assignmentStats.value = response.data.data || {
      totalActiveContests: 0,
      totalStationsInActiveContests: 0,
      assignedStations: 0,
      unassignedStations: 0,
      fullyAssignedContests: 0,
      assignmentProgress: 0,
      contests: [],
    };
  } catch (err: any) {
    console.error('Error loading statistics:', err);
    // Don't show error for stats, just log it
  } finally {
    statsLoading.value = false;
  }
}

async function loadAgentsWithMultipleContests() {
  try {
    const response = await api.get(
      '/admin/observer-assignments/multiple-contests'
    );
    agentsWithMultipleContests.value = response.data.data?.agents || [];
  } catch (err: any) {
    console.error('Error loading agents with multiple contests:', err);
    // Don't show error, just log it
  }
}

function getProgressColor(progress: number): string {
  if (progress >= 90) return 'bg-success-600';
  if (progress >= 75) return 'bg-primary-600';
  if (progress >= 50) return 'bg-warning-600';
  return 'bg-danger-600';
}

function editAssignment(assignment: Assignment) {
  // TODO: Implement edit assignment
  console.log('Edit assignment:', assignment);
}

async function removeAssignment(assignmentId: string) {
  if (!confirm('Are you sure you want to remove this assignment?')) {
    return;
  }

  try {
    await api.delete(`/admin/observer-assignments/${assignmentId}`);
    await loadAssignments();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to remove assignment';
    console.error('Error removing assignment:', err);
  }
}

function handleAssignmentCreated() {
  showAssignModal.value = false;
  loadAssignments();
  loadStatistics();
  loadAgentsWithMultipleContests();
}

onMounted(() => {
  loadAssignments();
  loadStatistics();
  loadAgentsWithMultipleContests();
});
</script>
