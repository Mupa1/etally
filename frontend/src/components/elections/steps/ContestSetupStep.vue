<template>
  <div class="contest-setup-step">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Contest Setup</h2>
    <p class="text-gray-600 mb-6">
      <span v-if="electionType === 'referendum'">
        Define the referendum question(s) for voters to decide on.
      </span>
      <span v-else>
        Configure the positions/contests that will be contested in this election.
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

      <Button
        type="button"
        variant="primary"
        @click="addQuestion"
      >
        + Add Question
      </Button>
    </div>

    <!-- Candidate-Based Contests -->
    <div v-else class="space-y-6">
      <!-- By-Election: Single Contest -->
      <div v-if="electionType === 'by_election'">
        <div class="border border-gray-300 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Contest Details</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Position Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="singleContest.positionName"
                @input="updateContests"
                type="text"
                placeholder="e.g., Member of Parliament - Kitui West"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                v-model="singleContest.description"
                @input="updateContests"
                rows="3"
                placeholder="Additional details about this contest..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              ></textarea>
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

        <!-- Show existing contests if any -->
        <div v-if="contests.length > 0" class="space-y-4">
          <div
            v-for="(contest, index) in contests"
            :key="index"
            class="border border-gray-300 rounded-lg p-4"
          >
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-semibold text-gray-800">{{ contest.positionName }}</h4>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Button from '@/components/common/Button.vue';

interface Props {
  contests: any[];
  referendumQuestions: any[];
  electionType: string | null;
}

interface Emits {
  (e: 'update:contests', value: any[]): void;
  (e: 'update:referendumQuestions', value: any[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const singleContest = ref({
  positionName: '',
  description: '',
});

// Initialize with existing data or defaults
if (props.electionType === 'by_election' && props.contests.length > 0) {
  singleContest.value = { ...props.contests[0] };
}

function updateContests() {
  if (props.electionType === 'by_election') {
    emit('update:contests', [singleContest.value]);
  }
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

function removeContest(index: number) {
  const newContests = props.contests.filter((_, i) => i !== index);
  emit('update:contests', newContests);
}

// Watch for changes in single contest
watch(singleContest, updateContests, { deep: true });
</script>

