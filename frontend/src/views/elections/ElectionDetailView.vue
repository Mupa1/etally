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
          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                {{ election.title }}
              </h1>
              <p
                v-if="election.description"
                class="text-sm text-gray-600 mt-2 max-w-3xl"
              >
                {{ election.description }}
              </p>
            </div>
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-end"
            >
            <div class="flex flex-wrap gap-2">
              <Badge
                :variant="getStatusVariant(election.status)"
                :label="formatStatus(election.status)"
              />
              <Badge
                variant="info"
                :label="formatElectionType(election.electionType)"
              />
                <Badge
                  variant="secondary"
                  :label="`Code: ${election.electionCode}`"
                />
              </div>
              <!-- Action Buttons for Election Managers -->
              <div
                v-if="authStore.isElectionManager"
                class="flex flex-wrap gap-2 sm:ml-4"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  @click="handleEditTimeline"
                  :disabled="
                    isDeleting ||
                    ['completed', 'cancelled'].includes(election.status)
                  "
                >
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Timeline
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  @click="showDeleteConfirm = true"
                  :disabled="
                    isDeleting ||
                    ['completed', 'cancelled'].includes(election.status)
                  "
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Election
                </Button>
              </div>
            </div>
          </div>

          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
          >
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

        <!-- Contests -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Contests</h2>
            <div class="flex items-center gap-3">
            <Badge
              variant="secondary"
              :label="`${contestCount} contest${contestCount === 1 ? '' : 's'}`"
            />
              <!-- Download Template Button (available for all by-elections) -->
              <Button
                v-if="election.electionType === 'by_election'"
                variant="secondary"
                size="sm"
                @click="downloadContestsTemplate"
              >
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Template
              </Button>
              <!-- Upload Contests Button (only for by-elections and managers) -->
              <Button
                v-if="
                  election.electionType === 'by_election' &&
                  authStore.isElectionManager
                "
                variant="primary"
                size="sm"
                @click="showUploadContestsModal = true"
                :disabled="isUploading"
              >
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Contests
              </Button>
            </div>
          </div>

          <div v-if="contestCount === 0" class="text-sm text-gray-500">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-blue-800 font-medium mb-2">
                No contests have been configured for this election yet.
              </p>
              <p class="text-blue-700 text-sm">
                <span v-if="election.electionType === 'by_election'">
                  You can upload contests and candidates using a CSV file, or add them manually.
                  Click the "Upload Contests" button above to get started.
                </span>
                <span v-else>
                  Contests will be configured based on the election's geographic coverage.
                </span>
              </p>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(contest, index) in election.contests"
              :key="contest.id || `${contest.positionName}-${index}`"
              class="border border-gray-200 rounded-lg"
            >
              <!-- Contest Header (Clickable to expand/collapse) -->
              <div
                @click="toggleContestExpansion(contest.id || index)"
                class="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    class="flex-shrink-0 text-gray-400 transition-transform"
                    :class="{ 'rotate-90': isContestExpanded(contest.id || index) }"
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-base font-semibold text-gray-900">
                      {{ contest.positionName || 'Contest' }}
                    </h3>
                    <p
                      v-if="getContestDescription(contest)"
                      class="text-sm text-gray-600 mt-1"
                    >
                      {{ getContestDescription(contest) }}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="info"
                  :label="`${contest.candidates?.length || 0} candidate${
                    (contest.candidates?.length || 0) === 1 ? '' : 's'
                  }`"
                  class="flex-shrink-0"
                />
              </div>

              <!-- Contest Content (Collapsible) -->
              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-[2000px]"
                leave-active-class="transition-all duration-300 ease-in"
                leave-from-class="opacity-100 max-h-[2000px]"
                leave-to-class="opacity-0 max-h-0"
              >
                <div
                  v-if="isContestExpanded(contest.id || index)"
                  class="overflow-hidden"
                >
                  <div
                    v-if="contest.candidates && contest.candidates.length"
                    class="px-4 pb-4 border-t border-gray-100 pt-3"
                  >
                    <p class="text-xs uppercase tracking-wide text-gray-400 mb-2">
                      Candidates
                    </p>
                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                      <div
                        v-for="candidate in contest.candidates"
                        :key="candidate.id"
                        class="border border-gray-100 rounded-lg p-3"
                      >
                        <p class="text-sm font-medium text-gray-900">
                          {{ candidate.fullName || candidate.name }}
                          <span
                            v-if="candidate.party?.abbreviation"
                            class="text-xs font-semibold text-primary-600 ml-2"
                          >
                            ({{ candidate.party.abbreviation }})
                          </span>
                          <span
                            v-else-if="candidate.isIndependent"
                            class="text-xs font-semibold text-gray-500 ml-2"
                          >
                            (Independent)
                          </span>
                          <CoalitionBadge
                            v-if="candidate.party?.coalitions && candidate.party.coalitions.length > 0"
                            :coalitions="getCoalitionsForParty(candidate.party)"
                            class="ml-2"
                          />
                        </p>
                        <p
                          v-if="candidate.party && !candidate.party.abbreviation"
                          class="text-xs text-gray-500 mt-1"
                        >
                          Party: {{ candidate.party?.partyName || candidate.party?.name }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="px-4 pb-4 border-t border-gray-100 pt-3"
                  >
                    <p class="text-sm text-gray-500">No candidates added yet.</p>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Timeline</h2>
          <div
            v-if="timelineItems.length === 0"
            class="text-sm text-gray-500 text-center py-8"
          >
            No timeline dates have been configured for this election.
          </div>
          <div v-else class="relative">
            <!-- Horizontal Timeline -->
            <div class="overflow-x-auto pb-4">
              <div
                class="flex items-start min-w-max px-4"
                style="min-width: 800px"
              >
                <template
                  v-for="(item, index) in timelineItems"
                  :key="item.key"
                >
                  <!-- Timeline Stage Container -->
                  <div
                    class="flex items-start relative"
                    :style="
                      index < timelineItems.length - 1
                        ? 'flex: 1 1 0'
                        : 'flex: 0 0 auto'
                    "
                  >
                    <!-- Timeline Stage -->
                    <div class="flex flex-col items-center w-full relative">
                      <!-- Date Circle/Node -->
                      <div
                        class="relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm shadow-md transition-all flex-shrink-0"
                        :class="getTimelineNodeClass(item.date)"
                      >
                        <svg
                          v-if="item.date && isDatePast(item.date)"
                          class="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <span v-else class="text-xs font-semibold">{{
                          index + 1
                        }}</span>
                      </div>

                      <!-- Connecting Line (horizontal line connecting to next node) -->
                      <div
                        v-if="index < timelineItems.length - 1"
                        class="absolute top-6 left-1/2 h-0.5 w-full"
                        :class="
                          getTimelineLineClass(
                            item.date,
                            timelineItems[index + 1]?.date
                          )
                        "
                        style="width: calc(100% - 24px)"
                      ></div>

                      <!-- Label and Date -->
                      <div
                        class="mt-4 px-2 text-center w-full max-w-[160px] mx-auto"
                      >
                        <p
                          class="text-xs font-medium text-gray-900 mb-1 leading-tight break-words"
                        >
                          {{ item.label }}
                        </p>
                        <p
                          class="text-xs text-gray-600 leading-tight"
                          :class="item.date ? '' : 'text-gray-400 italic'"
                        >
                          {{ item.date ? formatDate(item.date) : 'Not set' }}
              </p>
            </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Coverage -->
        <div class="card" v-if="election.electionType !== 'by_election'">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Geographic Coverage
          </h2>
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <Badge
                variant="primary"
                :label="formatScopeLevel(election.scopeLevel)"
              />
              <span v-if="coverageSummary" class="text-sm text-gray-600">
                {{ coverageSummary }}
              </span>
            </div>
            <p v-if="!election.scopeLevel" class="text-sm text-gray-500">
              Coverage level not specified. Edit the election to configure
              geographic coverage.
            </p>
          </div>
        </div>

        <!-- By-Election Coverage Note -->
        <div v-if="election.electionType === 'by_election'" class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Geographic Coverage
          </h2>
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p class="text-sm text-gray-700">
              By-elections don't have an election-level geographic scope. Each contest
              has its own geographic coverage (county, constituency, or ward) that is
              specified when the contest is created.
            </p>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        v-model="showDeleteConfirm"
        title="Delete Election"
        message="Are you sure you want to delete this election? This action cannot be undone."
        description="This will permanently delete the election and all associated data. Only draft elections can be deleted."
        variant="danger"
        confirm-label="Delete"
        cancel-label="Cancel"
        @confirm="handleDeleteElection"
      />

      <!-- Upload Contestants Modal (for existing contest) -->
      <ContestantsUploadModal
        v-model="showUploadModal"
        :election-id="election?.id"
        :contest-id="election?.contests?.[0]?.id"
        :election-type="election?.electionType"
        @uploaded="handleContestantsUploaded"
      />

      <!-- Upload Contests Modal (for by-elections) -->
      <ContestsUploadModal
        v-model="showUploadContestsModal"
        :election-id="election?.id"
        :election-type="election?.electionType"
        @uploaded="handleContestsUploaded"
      />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import CoalitionBadge from '@/components/common/CoalitionBadge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ContestantsUploadModal from '@/components/elections/ContestantsUploadModal.vue';
import ContestsUploadModal from '@/components/elections/ContestsUploadModal.vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import api from '@/utils/api';
import { handleError } from '@/utils/errorHandler';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const election = ref<any | null>(null);
const loading = ref(false);
const error = ref('');
const showDeleteConfirm = ref(false);
const isDeleting = ref(false);
const isUpdating = ref(false);
const showUploadModal = ref(false);
const showUploadContestsModal = ref(false);
const isUploading = ref(false);

const contestCount = computed(() => election.value?.contests?.length || 0);

// Track expanded/collapsed state for contests
const expandedContests = ref<Set<string | number>>(new Set());

function isContestExpanded(contestId: string | number): boolean {
  return expandedContests.value.has(contestId);
}

function toggleContestExpansion(contestId: string | number) {
  if (expandedContests.value.has(contestId)) {
    expandedContests.value.delete(contestId);
  } else {
    expandedContests.value.add(contestId);
  }
}

// Expand all contests by default when election is loaded
watch(
  () => election.value?.contests,
  (contests) => {
    if (contests && contests.length > 0) {
      contests.forEach((contest, index) => {
        const contestId = contest.id || index;
        if (!expandedContests.value.has(contestId)) {
          expandedContests.value.add(contestId);
        }
      });
    }
  },
  { immediate: true }
);

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
      label: 'Agent Call Date',
      date: election.value.observerCallDate,
    },
    {
      key: 'observerAppDeadline',
      label: 'Agent Application Deadline',
      date: election.value.observerAppDeadline,
    },
    {
      key: 'observerReviewDeadline',
      label: 'Agent Review Deadline',
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
    election.value.constituencyName ||
    election.value.constituency?.name ||
    null;
  const wardName = election.value.wardName || election.value.ward?.name || null;

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

    error.value =
      err.response?.data?.message || 'Failed to load election details';
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
  const map: Record<
    string,
    'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'
  > = {
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

function isDatePast(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed < new Date();
}

function getTimelineNodeClass(date: string | Date | null | undefined): string {
  if (!date) {
    return 'bg-gray-200 text-gray-500 border-2 border-gray-300';
  }
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'bg-gray-200 text-gray-500 border-2 border-gray-300';
  }
  const now = new Date();
  if (parsed < now) {
    return 'bg-green-500 text-white border-2 border-green-600';
  } else if (parsed.toDateString() === now.toDateString()) {
    return 'bg-blue-500 text-white border-2 border-blue-600';
  } else {
    return 'bg-gray-100 text-gray-700 border-2 border-gray-300';
  }
}

function getTimelineLineClass(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): string {
  const now = new Date();
  let startPast = false;
  let endPast = false;

  if (startDate) {
    const parsed = startDate instanceof Date ? startDate : new Date(startDate);
    if (!Number.isNaN(parsed.getTime())) {
      startPast = parsed < now;
    }
  }

  if (endDate) {
    const parsed = endDate instanceof Date ? endDate : new Date(endDate);
    if (!Number.isNaN(parsed.getTime())) {
      endPast = parsed < now;
    }
  }

  // If both dates are past, line is completed (green)
  if (startPast && endPast) {
    return 'bg-green-500';
  }
  // If start is past but end is future, line is in progress (blue)
  if (startPast && !endPast) {
    return 'bg-blue-500';
  }
  // Both future, line is pending (gray)
  return 'bg-gray-300';
}

async function handleEditTimeline() {
  // TODO: Implement timeline editing
  // Options:
  // 1. Navigate to an edit route: router.push(`/elections/${route.params.id}/edit`)
  // 2. Open a modal with timeline form fields
  // 3. Make timeline dates editable inline

  // For now, show a message that timeline editing is coming soon
  toast.info(
    'Timeline editing feature coming soon. You can update timeline dates via the API.'
  );

  // Alternative: Navigate to edit route if it exists
  // router.push(`/elections/${route.params.id}/edit`);
}

async function handleDeleteElection() {
  if (!election.value) return;

  isDeleting.value = true;
  showDeleteConfirm.value = false;

  try {
    await api.delete(`/elections/${election.value.id}`);
    toast.success('Election deleted successfully');
    router.push('/elections');
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to delete election';
    error.value = message;
    toast.error(message);
    console.error('Error deleting election:', err);
  } finally {
    isDeleting.value = false;
  }
}

async function handleContestantsUploaded() {
  // Reload election data to show new contestants
  await loadElection();
  showUploadModal.value = false;
}

async function handleContestsUploaded() {
  // Reload election data to show new contests and candidates
  await loadElection();
  showUploadContestsModal.value = false;
}

async function downloadContestsTemplate() {
  try {
    const response = await api.get('/elections/contests/template', {
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `contests-template-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  } catch (err: any) {
    const message =
      err.response?.data?.message || 'Error downloading template';
    error.value = message;
    toast.error(message);
    console.error('Download error:', err);
  }
}

function getContestDescription(contest: any): string | null {
  if (!contest || !contest.description) {
    return null;
  }

  const description = contest.description.trim();
  if (!description) {
    return null;
  }

  const positionName = contest.positionName?.trim();
  const contestType = contest.contestType?.trim();

  if (
    contestType &&
    positionName &&
    description.toLowerCase() ===
      `${contestType.toLowerCase()} contest for ${positionName.toLowerCase()}`
  ) {
    return null;
  }

  const cleaned = description
    .replace(
      /^(presidential|gubernatorial|senatorial|national_assembly|county_assembly|women'?s?_?representative|womens?_rep)\s+contest\s+for\s+/i,
      ''
    )
    .trim();

  const finalDescription = cleaned || description;

  if (positionName && finalDescription.toLowerCase() === positionName.toLowerCase()) {
    return null;
  }

  return finalDescription;
}

// Helper function to transform coalition data from backend format to component format
function getCoalitionsForParty(party: any): Array<{
  id: string;
  name: string;
  abbreviation?: string;
  isCompetitor?: boolean;
  isActive?: boolean;
}> {
  if (!party || !party.coalitions || !Array.isArray(party.coalitions)) {
    return [];
  }
  
  // Transform from PartyCoalition[] format to Coalition[] format
  // Backend returns: { coalitions: [{ coalition: { id, name, ... } }] }
  return party.coalitions
    .map((pc: any) => pc.coalition || pc)
    .filter((c: any) => c != null && c.isActive)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      abbreviation: c.abbreviation,
      isCompetitor: c.isCompetitor || false,
      isActive: c.isActive !== undefined ? c.isActive : true,
    }));
}
</script>
