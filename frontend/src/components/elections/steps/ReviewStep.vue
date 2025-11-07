<template>
  <div class="review-step">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Review & Create</h2>
    <p class="text-gray-600 mb-6">
      Review all the information before creating the election. You can go back to make changes.
    </p>

    <div class="space-y-6">
      <!-- Election Type -->
      <div class="border-b pb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Election Type</h3>
        <div class="flex items-center">
          <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {{ getElectionTypeLabel(electionType) }}
          </span>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="border-b pb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt class="text-sm font-medium text-gray-500">Election Code</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formData.electionCode || 'Not set' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Title</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formData.title || 'Not set' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Election Date</dt>
            <dd class="mt-1 text-sm text-gray-900">
              {{ formData.electionDate ? formatDate(formData.electionDate) : 'Not set' }}
            </dd>
          </div>
          <div v-if="formData.description">
            <dt class="text-sm font-medium text-gray-500">Description</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formData.description }}</dd>
          </div>
        </dl>
      </div>

      <!-- Timeline -->
      <div class="border-b pb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Timeline</h3>
        <dl class="space-y-2 text-sm">
          <div v-if="formData.nominationOpenDate" class="flex justify-between">
            <dt class="text-gray-500">Nomination Opens:</dt>
            <dd class="text-gray-900">{{ formatDate(formData.nominationOpenDate) }}</dd>
          </div>
          <div v-if="formData.nominationCloseDate" class="flex justify-between">
            <dt class="text-gray-500">Nomination Closes:</dt>
            <dd class="text-gray-900">{{ formatDate(formData.nominationCloseDate) }}</dd>
          </div>
          <div v-if="formData.observerCallDate" class="flex justify-between">
            <dt class="text-gray-500">Observer Call Date:</dt>
            <dd class="text-gray-900">{{ formatDate(formData.observerCallDate) }}</dd>
          </div>
          <div v-if="formData.observerAppDeadline" class="flex justify-between">
            <dt class="text-gray-500">Observer Application Deadline:</dt>
            <dd class="text-gray-900">{{ formatDate(formData.observerAppDeadline) }}</dd>
          </div>
          <div v-if="formData.tallyingStartDate" class="flex justify-between">
            <dt class="text-gray-500">Tallying Starts:</dt>
            <dd class="text-gray-900">{{ formatDate(formData.tallyingStartDate) }}</dd>
          </div>
          <div v-if="formData.tallyingEndDate" class="flex justify-between">
            <dt class="text-gray-500">Tallying Ends:</dt>
            <dd class="text-gray-900">{{ formatDate(formData.tallyingEndDate) }}</dd>
          </div>
        </dl>
      </div>

      <!-- Contests/Questions -->
      <div class="border-b pb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">
          <span v-if="electionType === 'referendum'">Referendum Questions</span>
          <span v-else>Contests</span>
        </h3>
        <div v-if="electionType === 'referendum'">
          <div
            v-for="(question, index) in formData.referendumQuestions"
            :key="index"
            class="mb-3 p-3 bg-gray-50 rounded-lg"
          >
            <p class="text-sm font-medium text-gray-900">
              Question {{ index + 1 }}: {{ question.questionText }}
            </p>
          </div>
          <p v-if="!formData.referendumQuestions || formData.referendumQuestions.length === 0" class="text-sm text-gray-500">
            No questions added
          </p>
        </div>
        <div v-else>
          <div
            v-for="(contest, index) in formData.contests"
            :key="index"
            class="mb-3 p-3 bg-gray-50 rounded-lg"
          >
            <p class="text-sm font-medium text-gray-900">{{ contest.positionName }}</p>
            <p v-if="contest.description" class="text-xs text-gray-600 mt-1">
              {{ contest.description }}
            </p>
          </div>
          <p v-if="!formData.contests || formData.contests.length === 0" class="text-sm text-gray-500">
            <span v-if="electionType === 'general_election'">
              Contests will be created automatically based on geographic scope
            </span>
            <span v-else>No contests added</span>
          </p>
        </div>
      </div>

      <!-- Geographic Scope -->
      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Geographic Scope</h3>
        <div v-if="electionType === 'general_election' || electionType === 'referendum'" class="text-sm text-gray-600">
          <p>National coverage (all areas)</p>
        </div>
        <div v-else-if="electionType === 'by_election'" class="text-sm text-gray-600">
          <p v-if="formData.countyId || formData.constituencyId || formData.wardId">
            Selected area will be displayed here
          </p>
          <p v-else class="text-orange-600">No geographic area selected</p>
        </div>
      </div>

      <!-- Validation Summary -->
      <div v-if="validationErrors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 class="font-semibold text-red-800 mb-2">Please fix the following issues:</h4>
        <ul class="list-disc list-inside text-sm text-red-700 space-y-1">
          <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  formData: any;
  electionType: string | null;
}

const props = defineProps<Props>();

function getElectionTypeLabel(type: string | null): string {
  switch (type) {
    case 'general_election':
      return 'General Election';
    case 'by_election':
      return 'By-Election';
    case 'referendum':
      return 'Referendum';
    case 're_run_election':
      return 'Re-Run Election';
    default:
      return 'Unknown';
  }
}

function formatDate(date: Date | string | null): string {
  if (!date) return 'Not set';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const validationErrors = computed(() => {
  const errors: string[] = [];
  
  if (!props.formData.electionCode) errors.push('Election code is required');
  if (!props.formData.title) errors.push('Title is required');
  if (!props.formData.electionDate) errors.push('Election date is required');
  
  if (props.electionType === 'referendum') {
    if (!props.formData.referendumQuestions || props.formData.referendumQuestions.length === 0) {
      errors.push('At least one referendum question is required');
    }
  } else if (props.electionType === 'by_election') {
    if (!props.formData.contests || props.formData.contests.length === 0) {
      errors.push('At least one contest is required');
    }
  }
  
  return errors;
});
</script>

