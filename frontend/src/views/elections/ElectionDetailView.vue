<template>
  <MainLayout
    page-title="Election Details"
    page-description="View and manage election information"
  >
    <div class="space-y-6">
      <!-- Back Button -->
      <div>
        <Button variant="secondary" size="sm" @click="goBack">
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Elections
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card">
        <div class="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" class="text-primary-600" />
        </div>
      </div>

      <!-- Error State -->
      <Alert v-else-if="error" variant="danger" :message="error" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="!election"
        icon="search"
        title="Election not found"
        description="The election you are looking for does not exist or you do not have permission to view it."
        action-label="Back to Elections"
        @action="goBack"
      />

      <!-- Election Details -->
      <div v-else class="space-y-6">
        <!-- Header Card -->
        <div class="card">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                {{ election.title }}
              </h1>
              <p v-if="election.description" class="text-sm text-gray-600 mt-2 max-w-3xl">
                {{ election.description }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Badge
                :variant="getStatusVariant(election.status)"
                :label="formatStatus(election.status)"
              />
              <Badge
                variant="info"
                :label="formatElectionType(election.electionType)"
              />
              <Badge variant="secondary" :label="`Code: ${election.electionCode}`" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div class="space-y-1">
              <p class="text-sm text-gray-500">Election Date</p>
              <p class="text-base font-medium text-gray-900">
                {{ formatDate(election.electionDate) }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500">Created By</p>
              <p class="text-base font-medium text-gray-900">
                {{ formatCreator(election.creator) }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500">Created On</p>
              <p class="text-base font-medium text-gray-900">
                {{ formatDate(election.createdAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="item in timelineItems"
              :key="item.key"
              class="border border-gray-200 rounded-lg p-4"
            >
              <p class="text-sm text-gray-500">{{ item.label }}</p>
              <p class="text-base font-medium text-gray-900">
                {{ formatDate(item.date) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Coverage -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Geographic Coverage</h2>
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <Badge variant="primary" :label="formatScopeLevel(election.scopeLevel)" />
              <span v-if="coverageSummary" class="text-sm text-gray-600">
                {{ coverageSummary }}
              </span>
            </div>
            <p v-if="!election.scopeLevel" class="text-sm text-gray-500">
              Coverage level not specified. Edit the election to configure geographic coverage.
            </p>
          </div>
        </div>

        <!-- Contests -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Contests</h2>
            <Badge
              variant="secondary"
              :label="`${contestCount} contest${contestCount === 1 ? '' : 's'}`"
            />
          </div>

          <div v-if="contestCount === 0" class="text-sm text-gray-500">
            No contests have been configured for this election yet.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(contest, index) in election.contests"
              :key="contest.id || `${contest.positionName}-${index}`"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h3 class="text-base font-semibold text-gray-900">
                    {{ contest.positionName || 'Contest' }}
                  </h3>
                  <p v-if="contest.description" class="text-sm text-gray-600 mt-1">
                    {{ contest.description }}
                  </p>
                </div>
                <Badge
                  variant="info"
                  :label="`${contest.candidates?.length || 0} candidate${
                    (contest.candidates?.length || 0) === 1 ? '' : 's'
                  }`
                  "
                />
              </div>

              <div v-if="contest.candidates && contest.candidates.length" class="mt-3">
                <p class="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Candidates
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div
                    v-for="candidate in contest.candidates"
                    :key="candidate.id"
                    class="border border-gray-100 rounded-lg p-3"
                  >
                    <p class="text-sm font-medium text-gray-900">
                      {{ candidate.fullName || candidate.name }}
                    </p>
                    <p v-if="candidate.party" class="text-xs text-gray-500 mt-1">
                      Party: {{ candidate.party?.name || candidate.party }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Metadata -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-gray-500">Election ID</p>
              <p class="text-sm font-medium text-gray-800 break-all">
                {{ election.id }}
              </p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500">Status Last Updated</p>
              <p class="text-sm font-medium text-gray-800">
                {{ formatDate(election.updatedAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { useToast } from '@/composables/useToast';
import api from '@/utils/api';
import { handleError } from '@/utils/errorHandler';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const election = ref<any | null>(null);
const loading = ref(false);
const error = ref('');

const contestCount = computed(() => election.value?.contests?.length || 0);

const timelineItems = computed(() => {
  if (!election.value) return [];
  return [
    {
      key: 'nominationOpenDate',
      label: 'Nomination Opens',
      date: election.value.nominationOpenDate,
    },
    {
      key: 'nominationCloseDate',
      label: 'Nomination Closes',
      date: election.value.nominationCloseDate,
    },
    {
      key: 'observerCallDate',
      label: 'Observer Call Date',
      date: election.value.observerCallDate,
    },
    {
      key: 'observerAppDeadline',
      label: 'Observer Application Deadline',
      date: election.value.observerAppDeadline,
    },
    {
      key: 'observerReviewDeadline',
      label: 'Observer Review Deadline',
      date: election.value.observerReviewDeadline,
    },
    {
      key: 'electionDate',
      label: 'Election Date',
      date: election.value.electionDate,
    },
    {
      key: 'tallyingStartDate',
      label: 'Tallying Starts',
      date: election.value.tallyingStartDate,
    },
    {
      key: 'tallyingEndDate',
      label: 'Tallying Ends',
      date: election.value.tallyingEndDate,
    },
    {
      key: 'resultsPublishDate',
      label: 'Results Publish Date',
      date: election.value.resultsPublishDate,
    },
  ].filter((item) => item.date);
});

const coverageSummary = computed(() => {
  if (!election.value?.scopeLevel) return '';

  const countyName =
    election.value.countyName || election.value.county?.name || null;
  const constituencyName =
    election.value.constituencyName || election.value.constituency?.name || null;
  const wardName =
    election.value.wardName || election.value.ward?.name || null;

  if (election.value.scopeLevel === 'nationwide') {
    return 'Covers all polling areas nationally.';
  }
  if (election.value.scopeLevel === 'county' && countyName) {
    return `Covers ${countyName} County.`;
  }
  if (election.value.scopeLevel === 'constituency' && constituencyName) {
    return `Covers ${constituencyName} Constituency.`;
  }
  if (election.value.scopeLevel === 'county_assembly' && wardName) {
    return `Covers ${wardName} Ward.`;
  }
  return '';
});

onMounted(() => {
  loadElection();
});

watch(
  () => route.params.id,
  () => {
    loadElection();
  }
);

async function loadElection() {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get(`/elections/${route.params.id}`);
    election.value = response.data.data;
  } catch (err: any) {
    handleError(err, {
      component: 'ElectionDetailView',
      action: 'fetch_election_details',
    });

    error.value = err.response?.data?.message || 'Failed to load election details';
    toast.error(error.value);
    election.value = null;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/elections');
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return 'Not set';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Not set';
  return parsed.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCreator(creator: any) {
  if (!creator) return 'Unknown';
  const name = [creator.firstName, creator.lastName].filter(Boolean).join(' ');
  return name || creator.email || 'Unknown';
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
}

function getStatusVariant(status: string) {
  const map: Record<string, 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    draft: 'gray',
    scheduled: 'info',
    active: 'success',
    paused: 'warning',
    completed: 'secondary',
    cancelled: 'danger',
  };
  return map[status] || 'gray';
}

function formatElectionType(type: string) {
  const map: Record<string, string> = {
    general_election: 'General Election',
    by_election: 'By-Election',
    referendum: 'Referendum',
    re_run_election: 'Re-Run Election',
  };
  return map[type] || type;
}

function formatScopeLevel(level: string | null | undefined) {
  const map: Record<string, string> = {
    nationwide: 'Nationwide',
    county: 'County-wide',
    constituency: 'Constituency-wide',
    county_assembly: 'County Assembly-wide',
  };
  return map[level || ''] || 'Coverage not set';
}
</script>
