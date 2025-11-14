<template>
  <div class="contest-scope-step space-y-8">
    <!-- Contest / Question Setup -->
    <section>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Contests & Coverage</h2>
      <p class="text-gray-600 mb-6">
        <span v-if="electionType === 'referendum'">
          Define the referendum question(s) and coverage for this election.
        </span>
        <span v-else>
          Configure the contests and geographic coverage for this election.
        </span>
      </p>

      <!-- Referendum Questions -->
      <div v-if="electionType === 'referendum'" class="space-y-6">
        <div
          v-for="(question, index) in referendumQuestions"
          :key="index"
          class="border border-gray-300 rounded-lg p-4"
        >
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">
              Question {{ index + 1 }}
            </h3>
            <Button
              type="button"
              variant="danger"
              size="sm"
              @click="removeQuestion(index)"
            >
              Remove
            </Button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Question Text <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="question.questionText"
                @input="updateQuestions"
                rows="3"
                placeholder="Enter the referendum question..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                v-model="question.questionType"
                @change="updateQuestions"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="yes_no">Yes/No (Binary)</option>
              </select>
            </div>
          </div>
        </div>

        <Button type="button" variant="primary" @click="addQuestion">
          + Add Question
        </Button>
      </div>

      <!-- Candidate-Based Contests -->
      <div v-else class="space-y-6">
        <!-- By-Election: Contests Added Later -->
        <div v-if="electionType === 'by_election'">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div class="flex items-start">
              <svg
                class="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">
                  Contests Will Be Added Later
                </h3>
                <p class="text-sm text-blue-800 mb-3">
                  For by-elections, contests and their geographic coverage will be
                  added after the election is created. You can upload contests and
                  candidates using a CSV file or add them manually from the election
                  details page.
                </p>
                <ul class="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Each contest will have its own geographic coverage (county, constituency, or ward)</li>
                  <li>Contests can be uploaded via CSV file with candidate details</li>
                  <li>Contests can also be added manually one at a time</li>
                  <li>The system will automatically detect contest type based on geographic data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- General Election: Multiple Contests -->
        <div v-else-if="electionType === 'general_election'">
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-4">
              For general elections, contests will be created based on geographic data.
              You can customize individual contests after creation.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-blue-800">
                <strong>Note:</strong> Contest creation for general elections will be handled
                automatically based on the geographic scope. You can add or modify contests
                after the election is created.
              </p>
            </div>
          </div>

          <div v-if="contests.length > 0" class="space-y-4">
            <div
              v-for="(contest, index) in contests"
              :key="index"
              class="border border-gray-300 rounded-lg p-4"
            >
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-800">
                  {{ contest.positionName || 'Contest' }}
                </h4>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  @click="removeContest(index)"
                >
                  Remove
                </Button>
              </div>
              <p v-if="contest.description" class="text-sm text-gray-600">
                {{ contest.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Other election types -->
        <div v-else>
          <div class="space-y-4">
            <div class="border border-gray-300 rounded-lg p-4">
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-800">Contests</h4>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  @click="addContest"
                >
                  Add Contest
                </Button>
              </div>

              <div v-if="localContests.length === 0" class="text-sm text-gray-500">
                No contests added yet.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(contest, index) in localContests"
                  :key="contest.id || `${contest.positionName}-${index}`"
                  class="border border-gray-200 rounded-lg p-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">
                          Position Name
                        </label>
                        <input
                          v-model="contest.positionName"
                          @input="updateMultipleContests"
                          type="text"
                          placeholder="e.g., Governor - Nairobi"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          v-model="contest.description"
                          @input="updateMultipleContests"
                          rows="2"
                          placeholder="Add additional details..."
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        ></textarea>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      @click="removeContest(index)"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Geographic Scope -->
    <section class="border border-gray-200 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Geographic Coverage</h3>
      </div>

      <div v-if="electionType === 'by_election'" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg
            class="w-5 h-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p class="text-sm font-medium text-gray-800 mb-1">No Election-Level Geographic Scope</p>
            <p class="text-xs text-gray-600">
              By-elections don't have an election-level geographic scope. Each contest
              will have its own geographic coverage (county, constituency, or ward) that
              will be specified when the contest is added.
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="autoNationwide" class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center mb-2">
          <svg
            class="w-5 h-5 text-green-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-sm font-medium text-green-800">Nationwide Coverage</p>
        </div>
        <p class="text-xs text-green-700">
          {{ electionType === 'referendum'
              ? 'Referendums are automatically configured for nationwide coverage.'
              : 'General elections are configured for nationwide coverage by default.'
          }}
        </p>
      </div>

      <div v-else>
        <GeographicScopeSelector
          :scopeLevel="internalScopeLevel"
          :countyId="countyId"
          :constituencyId="constituencyId"
          :wardId="wardId"
          :countyName="countyName"
          :constituencyName="constituencyName"
          :wardName="wardName"
          @update:scopeLevel="handleScopeLevelChange"
          @update:countyId="emit('update:countyId', $event)"
          @update:countyName="emit('update:countyName', $event)"
          @update:constituencyId="emit('update:constituencyId', $event)"
          @update:constituencyName="emit('update:constituencyName', $event)"
          @update:wardId="emit('update:wardId', $event)"
          @update:wardName="emit('update:wardName', $event)"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Button from '@/components/common/Button.vue';
import GeographicScopeSelector from '@/components/common/GeographicScopeSelector.vue';

type ScopeLevel = 'nationwide' | 'county' | 'constituency' | 'county_assembly';

interface Props {
  contests: any[];
  referendumQuestions: any[];
  electionType: string | null;
  scopeLevel?: string;
  countyId?: string | null;
  constituencyId?: string | null;
  wardId?: string | null;
  countyName?: string | null;
  constituencyName?: string | null;
  wardName?: string | null;
}

interface Emits {
  (e: 'update:contests', value: any[]): void;
  (e: 'update:referendumQuestions', value: any[]): void;
  (e: 'update:scopeLevel', value: string): void;
  (e: 'update:countyId', value: string | null): void;
  (e: 'update:constituencyId', value: string | null): void;
  (e: 'update:wardId', value: string | null): void;
  (e: 'update:countyName', value: string | null): void;
  (e: 'update:constituencyName', value: string | null): void;
  (e: 'update:wardName', value: string | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  scopeLevel: '',
  countyId: null,
  constituencyId: null,
  wardId: null,
  countyName: null,
  constituencyName: null,
  wardName: null,
});

const emit = defineEmits<Emits>();

const singleContest = ref({
  positionName: '',
  description: '',
});

const localContests = ref(
  props.contests.map((contest) => ({ ...contest }))
);

if (props.electionType === 'by_election' && props.contests.length > 0) {
  singleContest.value = { ...props.contests[0] };
}

const internalScopeLevel = ref<ScopeLevel | ''>(props.scopeLevel || '');

watch(
  () => props.scopeLevel,
  (val) => {
    internalScopeLevel.value = (val || '') as ScopeLevel | '';
  }
);

watch(singleContest, updateContests, { deep: true });

watch(
  () => props.contests,
  (value) => {
    const list = value || [];
    if (props.electionType === 'by_election') {
      if (list.length > 0) {
        const next = list[0];
        if (
          next.positionName !== singleContest.value.positionName ||
          next.description !== singleContest.value.description
        ) {
          singleContest.value = { ...next };
        }
      } else if (singleContest.value.positionName || singleContest.value.description) {
        singleContest.value = {
          positionName: '',
          description: '',
        };
      }
    } else {
      const cloned = list.map((contest) => ({ ...contest }));
      localContests.value = cloned;
    }
  },
  { immediate: true }
);

watch(
  () => props.electionType,
  (type) => {
    if (type === 'general_election' || type === 'referendum') {
      if (internalScopeLevel.value !== 'nationwide') {
        internalScopeLevel.value = 'nationwide';
        emit('update:scopeLevel', 'nationwide');
        emit('update:countyId', null);
        emit('update:constituencyId', null);
        emit('update:wardId', null);
        emit('update:countyName', null);
        emit('update:constituencyName', null);
        emit('update:wardName', null);
      }
    } else if (type === 'by_election') {
      // By-elections don't have election-level scope
      // Clear any scope settings
      internalScopeLevel.value = '';
      emit('update:scopeLevel', '');
      emit('update:countyId', null);
      emit('update:constituencyId', null);
      emit('update:wardId', null);
      emit('update:countyName', null);
      emit('update:constituencyName', null);
      emit('update:wardName', null);
      // Clear contests as they will be added later
      emit('update:contests', []);
    }
  },
  { immediate: true }
);

const autoNationwide = computed(() => {
  return (
    props.electionType === 'general_election' ||
    props.electionType === 'referendum'
  );
});

function updateContests() {
  // By-elections don't require contests at creation time
  // This function is kept for compatibility but contests will be empty for by-elections
  if (props.electionType === 'by_election') {
    emit('update:contests', []);
  }
}

function updateMultipleContests() {
  const updated = localContests.value.map((contest) => ({ ...contest }));
  emit('update:contests', updated);
}

function updateQuestions() {
  emit('update:referendumQuestions', [...props.referendumQuestions]);
}

function addQuestion() {
  const newQuestions = [
    ...props.referendumQuestions,
    {
      questionText: '',
      questionType: 'yes_no',
      orderIndex: props.referendumQuestions.length,
    },
  ];
  emit('update:referendumQuestions', newQuestions);
}

function removeQuestion(index: number) {
  const newQuestions = props.referendumQuestions.filter((_, i) => i !== index);
  emit('update:referendumQuestions', newQuestions);
}

function addContest() {
  const newContest = {
    positionName: '',
    description: '',
  };
  localContests.value = [...localContests.value, newContest];
  updateMultipleContests();
}

function removeContest(index: number) {
  localContests.value = localContests.value.filter((_, i) => i !== index);
  updateMultipleContests();
}

function handleScopeLevelChange(value: ScopeLevel | '') {
  internalScopeLevel.value = value;
  emit('update:scopeLevel', value);

  if (value === 'nationwide') {
    emit('update:countyId', null);
    emit('update:constituencyId', null);
    emit('update:wardId', null);
    emit('update:countyName', null);
    emit('update:constituencyName', null);
    emit('update:wardName', null);
  }
}
</script>

