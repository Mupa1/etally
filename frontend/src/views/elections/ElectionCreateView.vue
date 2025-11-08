<template>
  <MainLayout
    page-title="Create Election"
    page-description="Set up a new election with contests and candidates"
  >
    <div class="max-w-5xl mx-auto">
      <div class="card">
        <Wizard
          ref="wizardRef"
          :steps="wizardSteps"
          :loading="submitting"
          finish-label="Create Election"
          @next="handleStepNext"
          @previous="handleStepPrevious"
          @finish="handleCreateElection"
          @step-change="handleStepChange"
        >
          <!-- Step 1: Election Type Selection -->
          <ElectionTypeStep
            v-if="currentStep === 0"
            v-model="formData.electionType"
            v-model:parentElectionId="formData.parentElectionId"
            @update:model-value="handleFormUpdate"
          />

          <!-- Step 2: Basic Information -->
          <BasicInfoStep
            v-if="currentStep === 1"
            v-model:electionCode="formData.electionCode"
            v-model:title="formData.title"
            v-model:electionDate="formData.electionDate"
            v-model:description="formData.description"
            :election-type="formData.electionType"
            @update:model-value="handleFormUpdate"
          />

          <!-- Step 3: Timeline Configuration -->
          <TimelineStep
            v-if="currentStep === 2"
            v-model:electionDate="formData.electionDate"
            v-model:nominationOpenDate="formData.nominationOpenDate"
            v-model:nominationCloseDate="formData.nominationCloseDate"
            v-model:partyListDeadline="formData.partyListDeadline"
            v-model:observerCallDate="formData.observerCallDate"
            v-model:observerAppDeadline="formData.observerAppDeadline"
            v-model:observerReviewDeadline="formData.observerReviewDeadline"
            v-model:tallyingStartDate="formData.tallyingStartDate"
            v-model:tallyingEndDate="formData.tallyingEndDate"
            v-model:resultsPublishDate="formData.resultsPublishDate"
            :election-type="formData.electionType"
            @update:model-value="handleFormUpdate"
          />

          <!-- Step 4: Contests & Geographic Scope -->
          <ContestAndScopeStep
            v-if="currentStep === 3"
            v-model:contests="formData.contests"
            v-model:referendumQuestions="formData.referendumQuestions"
            v-model:scopeLevel="formData.scopeLevel"
            v-model:countyId="formData.countyId"
            v-model:countyName="formData.countyName"
            v-model:constituencyId="formData.constituencyId"
            v-model:constituencyName="formData.constituencyName"
            v-model:wardId="formData.wardId"
            v-model:wardName="formData.wardName"
            :election-type="formData.electionType"
            @update:model-value="handleFormUpdate"
          />

          <!-- Step 5: Review & Create -->
          <ReviewStep
            v-if="currentStep === 4"
            :form-data="formData"
            :election-type="formData.electionType"
          />
        </Wizard>

        <!-- Error Display -->
        <Alert v-if="error" variant="danger" :message="error" class="mt-4" />
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import api from '@/utils/api';
import { handleError } from '@/utils/errorHandler';
import MainLayout from '@/components/layout/MainLayout.vue';
import Wizard, { type WizardStep } from '@/components/common/Wizard.vue';
import Alert from '@/components/common/Alert.vue';
import ElectionTypeStep from '@/components/elections/steps/ElectionTypeStep.vue';
import BasicInfoStep from '@/components/elections/steps/BasicInfoStep.vue';
import TimelineStep from '@/components/elections/steps/TimelineStep.vue';
import ContestAndScopeStep from '@/components/elections/steps/ContestAndScopeStep.vue';
import ReviewStep from '@/components/elections/steps/ReviewStep.vue';

const router = useRouter();
const toast = useToast();

const wizardRef = ref<InstanceType<typeof Wizard> | null>(null);
const currentStep = ref(0);
const submitting = ref(false);
const error = ref('');

const wizardSteps: WizardStep[] = [
  { label: 'Type', key: 'type' },
  { label: 'Basic Info', key: 'basic' },
  { label: 'Timeline', key: 'timeline' },
  { label: 'Contests & Scope', key: 'contests_scope' },
  { label: 'Review', key: 'review' },
];

// Form data structure
const formData = ref({
  electionType: null as string | null,
  parentElectionId: null as string | null,
  electionCode: '',
  title: '',
  electionDate: null as Date | null,
  description: '',
  nominationOpenDate: null as Date | null,
  nominationCloseDate: null as Date | null,
  partyListDeadline: null as Date | null,
  observerCallDate: null as Date | null,
  observerAppDeadline: null as Date | null,
  observerReviewDeadline: null as Date | null,
  tallyingStartDate: null as Date | null,
  tallyingEndDate: null as Date | null,
  resultsPublishDate: null as Date | null,
  contests: [] as any[],
  referendumQuestions: [] as any[],
  scopeLevel: '' as string,
  countyId: null as string | null,
  constituencyId: null as string | null,
  wardId: null as string | null,
  countyName: null as string | null,
  constituencyName: null as string | null,
  wardName: null as string | null,
});

function handleFormUpdate() {
  // Update wizard formData
  if (wizardRef.value) {
    wizardRef.value.formData = formData.value;
  }
}

function handleStepNext(step: number, data: any) {
  error.value = '';
  // Validate the step we just moved to (step is the new step number)
  // We need to validate the previous step
  const previousStep = step - 1;
  if (!validateStep(previousStep)) {
    // Validation failed - go back to previous step
    if (wizardRef.value) {
      wizardRef.value.goToStep(previousStep);
    }
    currentStep.value = previousStep;
    return;
  }
  // Validation passed - update current step
  currentStep.value = step;
}

function handleStepPrevious(step: number) {
  error.value = '';
  currentStep.value = step;
}

function handleStepChange(step: number, previousStep: number) {
  error.value = '';
  currentStep.value = step;
}

function validateStep(stepIndex: number): boolean {
  switch (stepIndex) {
    case 0: // Type selection
      if (!formData.value.electionType) {
        error.value = 'Please select an election type';
        return false;
      }
      if (
        formData.value.electionType === 're_run_election' &&
        !formData.value.parentElectionId
      ) {
        error.value = 'Please select the parent election for re-run';
        return false;
      }
      return true;

    case 1: // Basic info
      if (!formData.value.electionCode?.trim()) {
        error.value = 'Election code is required';
        return false;
      }
      if (!formData.value.title?.trim()) {
        error.value = 'Title is required';
        return false;
      }
      if (!formData.value.electionDate) {
        error.value = 'Election date is required';
        return false;
      }
      if (new Date(formData.value.electionDate) <= new Date()) {
        error.value = 'Election date must be in the future';
        return false;
      }
      return true;

    case 2: // Timeline
      // Basic validation - can be enhanced
      return true;

    case 3: // Contests & Scope
      if (formData.value.electionType === 'referendum') {
        if (
          !formData.value.referendumQuestions ||
          formData.value.referendumQuestions.length === 0
        ) {
          error.value = 'At least one referendum question is required';
          return false;
        }
      } else if (formData.value.electionType !== 'general_election') {
        if (!formData.value.contests || formData.value.contests.length === 0) {
          error.value = 'At least one contest is required';
          return false;
        }
      }

      // Scope validation
      if (
        formData.value.electionType === 'general_election' ||
        formData.value.electionType === 'referendum'
      ) {
        // Force nationwide coverage for general elections and referendums
        formData.value.scopeLevel = 'nationwide';
        formData.value.countyId = null;
        formData.value.constituencyId = null;
        formData.value.wardId = null;
        formData.value.countyName = null;
        formData.value.constituencyName = null;
        formData.value.wardName = null;
        return true;
      }

      if (!formData.value.scopeLevel) {
        error.value = 'Please select a coverage level';
        return false;
      }

      if (formData.value.scopeLevel === 'county' && !formData.value.countyId) {
        error.value = 'Please select a county';
        return false;
      }

      if (
        formData.value.scopeLevel === 'constituency' &&
        !formData.value.constituencyId
      ) {
        error.value = 'Please select a constituency';
        return false;
      }

      if (
        formData.value.scopeLevel === 'county_assembly' &&
        !formData.value.wardId
      ) {
        error.value = 'Please select a ward';
        return false;
      }

      return true;

    default:
      return true;
  }
}

async function handleCreateElection(data: any) {
  error.value = '';
  submitting.value = true;

  try {
    // Final validation
    if (!validateStep(4)) {
      submitting.value = false;
      return;
    }

    // Prepare request payload
    const payload: any = {
      electionType: formData.value.electionType,
      electionCode: formData.value.electionCode.trim(),
      title: formData.value.title.trim(),
      electionDate: formData.value.electionDate,
      description: formData.value.description?.trim() || undefined,
      nominationOpenDate: formData.value.nominationOpenDate || undefined,
      nominationCloseDate: formData.value.nominationCloseDate || undefined,
      partyListDeadline: formData.value.partyListDeadline || undefined,
      observerCallDate: formData.value.observerCallDate || undefined,
      observerAppDeadline: formData.value.observerAppDeadline || undefined,
      observerReviewDeadline:
        formData.value.observerReviewDeadline || undefined,
      tallyingStartDate: formData.value.tallyingStartDate || undefined,
      tallyingEndDate: formData.value.tallyingEndDate || undefined,
      resultsPublishDate: formData.value.resultsPublishDate || undefined,
    };

    if (formData.value.scopeLevel) {
      payload.scopeLevel = formData.value.scopeLevel;
    }
    if (formData.value.countyId) {
      payload.countyId = formData.value.countyId;
    }
    if (formData.value.constituencyId) {
      payload.constituencyId = formData.value.constituencyId;
    }
    if (formData.value.wardId) {
      payload.wardId = formData.value.wardId;
    }

    // Add re-run specific field
    if (formData.value.electionType === 're_run_election') {
      payload.parentElectionId = formData.value.parentElectionId;
    }

    // Add contests or referendum questions
    if (formData.value.electionType === 'referendum') {
      payload.referendumQuestions = formData.value.referendumQuestions;
    } else {
      payload.contests = formData.value.contests;
    }

    // Create election
    const response = await api.post('/elections', payload);

    toast.success('Election created successfully');

    // Redirect to election detail page
    router.push(`/elections/${response.data.data.id}`);
  } catch (err: any) {
    const recovery = handleError(err, {
      component: 'ElectionCreateView',
      action: 'create_election',
    });

    error.value = err.response?.data?.message || 'Failed to create election';
    toast.error(error.value);
  } finally {
    submitting.value = false;
  }
}
</script>
