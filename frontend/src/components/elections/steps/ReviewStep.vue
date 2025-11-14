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
            Referendum questions can be added later from the election detail page.
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
              Contests can be added later from the election detail page.
            </span>
            <span v-else-if="electionType === 'by_election'">
              Contests will be added later via CSV upload or manual input. Each contest will have its own geographic coverage.
            </span>
            <span v-else>
              Contests can be added later from the election detail page.
            </span>
          </p>
        </div>
      </div>

      <!-- Geographic Scope -->
      <div class="border-b pb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Geographic Scope</h3>
        <div v-if="electionType === 'by_election'" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p class="text-sm text-gray-700">
            By-elections don't have an election-level geographic scope. Each contest
            will have its own geographic coverage (county, constituency, or ward) that
            will be specified when the contest is added.
          </p>
        </div>
        <div v-else-if="electionType === 'general_election' || electionType === 'referendum'" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-sm text-green-800">
            <strong>Nationwide Coverage:</strong> This election will cover all polling areas nationally.
          </p>
        </div>
        <div v-else class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-700">
            Geographic scope can be configured later from the election detail page if needed.
          </p>
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

function formatScopeLevel(level: string | null | undefined): string {
  const map: Record<string, string> = {
    nationwide: 'Nationwide',
    county: 'County-wide',
    constituency: 'Constituency-wide',
    county_assembly: 'County Assembly-wide',
  };
  return map[level || ''] || 'Not specified';
}

const scopeSummary = computed(() => {
  // By-elections don't have election-level scope
  if (props.electionType === 'by_election') {
    return {
      levelLabel: 'Not applicable',
      detail: null,
      note: 'By-elections have geographic coverage at the contest level, not the election level.',
    };
  }

  const level = props.formData.scopeLevel || '';
  const countyName = props.formData.countyName;
  const constituencyName = props.formData.constituencyName;
  const wardName = props.formData.wardName;

  if (!level) {
    return {
      levelLabel: 'Not specified',
      detail: null,
      note: 'No coverage level selected. Update contests & scope step to specify coverage.',
    };
  }

  if (level === 'nationwide') {
    return {
      levelLabel: 'Nationwide',
      detail: 'Covers all polling areas nationally.',
      note:
        props.electionType === 'referendum'
          ? 'Referendums are configured for nationwide coverage.'
          : undefined,
    };
  }

  if (level === 'county') {
    return {
      levelLabel: 'County-wide',
      detail: countyName
        ? `Covers ${countyName} County.`
        : 'County not selected.',
      note: undefined,
    };
  }

  if (level === 'constituency') {
    return {
      levelLabel: 'Constituency-wide',
      detail: constituencyName
        ? `Covers ${constituencyName} Constituency.`
        : 'Constituency not selected.',
      note: countyName ? `County: ${countyName}` : undefined,
    };
  }

  if (level === 'county_assembly') {
    return {
      levelLabel: 'County Assembly-wide (Ward-level)',
      detail: wardName ? `Covers ${wardName} Ward.` : 'Ward not selected.',
      note: constituencyName
        ? `Constituency: ${constituencyName}${
            countyName ? `, County: ${countyName}` : ''
          }`
        : countyName
        ? `County: ${countyName}`
        : undefined,
    };
  }

  return {
    levelLabel: formatScopeLevel(level),
    detail: null,
    note: undefined,
  };
});

const validationErrors = computed(() => {
  const errors: string[] = [];
  
  if (!props.formData.electionCode) errors.push('Election code is required');
  if (!props.formData.title) errors.push('Title is required');
  if (!props.formData.electionDate) errors.push('Election date is required');
  
  // Contests & scope step has been removed
  // All election types can be created without contests/questions at creation time
  // They can be added later via the election detail page
  // By-elections: contests added via CSV upload or manual input
  // Referendums: questions can be added later
  // Other types: contests can be added later
  // No validation errors for missing contests/questions or scope
  
  return errors;
});
</script>

