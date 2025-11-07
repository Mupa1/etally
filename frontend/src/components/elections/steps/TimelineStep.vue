<template>
  <div class="timeline-step">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Timeline Configuration</h2>
    <p class="text-gray-600 mb-6">
      Set key dates and deadlines for this election. Dates are automatically suggested based on the election date.
    </p>

    <div class="space-y-6">
      <!-- Nomination Period (for candidate-based elections) -->
      <div v-if="electionType !== 'referendum'" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Nomination Period</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nomination Open Date
            </label>
            <input
              :value="nominationOpenDate ? formatDateForInput(nominationOpenDate) : ''"
              @input="handleDateInput('nominationOpenDate', $event)"
              type="date"
              :min="getMinDate()"
              :max="electionDate ? formatDateForInput(electionDate) : ''"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nomination Close Date <span class="text-red-500">*</span>
            </label>
            <input
              :value="nominationCloseDate ? formatDateForInput(nominationCloseDate) : ''"
              @input="handleDateInput('nominationCloseDate', $event)"
              type="date"
              :min="nominationOpenDate ? formatDateForInput(nominationOpenDate) : getMinDate()"
              :max="electionDate ? formatDateForInput(electionDate) : ''"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      <!-- Party List Deadline (for general elections) -->
      <div v-if="electionType === 'general_election'">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Party List Deadline
        </label>
        <input
          :value="partyListDeadline ? formatDateForInput(partyListDeadline) : ''"
          @input="handleDateInput('partyListDeadline', $event)"
          type="date"
          :min="getMinDate()"
          :max="electionDate ? formatDateForInput(electionDate) : ''"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p class="text-xs text-gray-500 mt-1">
          Deadline for political parties to submit party lists
        </p>
      </div>

      <!-- Observer Application Period -->
      <div class="space-y-4 border-t pt-6">
        <h3 class="text-lg font-semibold text-gray-800">Observer Application Period</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Observer Call Date <span class="text-red-500">*</span>
            </label>
            <input
              :value="observerCallDate ? formatDateForInput(observerCallDate) : ''"
              @input="handleDateInput('observerCallDate', $event)"
              type="date"
              :min="getMinDate()"
              :max="electionDate ? formatDateForInput(electionDate) : ''"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              When to send emails to observers
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Application Deadline <span class="text-red-500">*</span>
            </label>
            <input
              :value="observerAppDeadline ? formatDateForInput(observerAppDeadline) : ''"
              @input="handleDateInput('observerAppDeadline', $event)"
              type="date"
              :min="observerCallDate ? formatDateForInput(observerCallDate) : getMinDate()"
              :max="electionDate ? formatDateForInput(electionDate) : ''"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              Last date for observers to apply
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Review Deadline <span class="text-red-500">*</span>
            </label>
            <input
              :value="observerReviewDeadline ? formatDateForInput(observerReviewDeadline) : ''"
              @input="handleDateInput('observerReviewDeadline', $event)"
              type="date"
              :min="observerAppDeadline ? formatDateForInput(observerAppDeadline) : getMinDate()"
              :max="electionDate ? formatDateForInput(electionDate) : ''"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              Last date to approve/reject applications
            </p>
          </div>
        </div>
      </div>

      <!-- Tallying Period -->
      <div class="space-y-4 border-t pt-6">
        <h3 class="text-lg font-semibold text-gray-800">Tallying Period</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Tallying Start Date <span class="text-red-500">*</span>
            </label>
            <input
              :value="tallyingStartDate ? formatDateForInput(tallyingStartDate) : ''"
              @input="handleDateInput('tallyingStartDate', $event)"
              type="date"
              :min="electionDate ? formatDateForInput(electionDate) : getMinDate()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              Typically the same as election date
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Tallying End Date <span class="text-red-500">*</span>
            </label>
            <input
              :value="tallyingEndDate ? formatDateForInput(tallyingEndDate) : ''"
              @input="handleDateInput('tallyingEndDate', $event)"
              type="date"
              :min="tallyingStartDate ? formatDateForInput(tallyingStartDate) : (electionDate ? formatDateForInput(electionDate) : getMinDate())"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              Typically 2-3 days after election date
            </p>
          </div>
        </div>
      </div>

      <!-- Results Publish Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Results Publish Date (Optional)
        </label>
        <input
          :value="resultsPublishDate ? formatDateForInput(resultsPublishDate) : ''"
          @input="handleDateInput('resultsPublishDate', $event)"
          type="date"
          :min="tallyingEndDate ? formatDateForInput(tallyingEndDate) : (electionDate ? formatDateForInput(electionDate) : getMinDate())"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p class="text-xs text-gray-500 mt-1">
          When official results will be published
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="border-t pt-6">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          @click="autoFillDates"
        >
          Auto-fill Suggested Dates
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import Button from '@/components/common/Button.vue';

interface Props {
  electionDate: Date | null;
  nominationOpenDate: Date | null;
  nominationCloseDate: Date | null;
  partyListDeadline: Date | null;
  observerCallDate: Date | null;
  observerAppDeadline: Date | null;
  observerReviewDeadline: Date | null;
  tallyingStartDate: Date | null;
  tallyingEndDate: Date | null;
  resultsPublishDate: Date | null;
  electionType: string | null;
}

interface Emits {
  (e: 'update:electionDate', value: Date | null): void;
  (e: 'update:nominationOpenDate', value: Date | null): void;
  (e: 'update:nominationCloseDate', value: Date | null): void;
  (e: 'update:partyListDeadline', value: Date | null): void;
  (e: 'update:observerCallDate', value: Date | null): void;
  (e: 'update:observerAppDeadline', value: Date | null): void;
  (e: 'update:observerReviewDeadline', value: Date | null): void;
  (e: 'update:tallyingStartDate', value: Date | null): void;
  (e: 'update:tallyingEndDate', value: Date | null): void;
  (e: 'update:resultsPublishDate', value: Date | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return '';
}

function getMinDate(): string {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

function handleDateInput(field: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const date = target.value ? new Date(target.value) : null;
  emit(`update:${field}` as any, date);
}

function autoFillDates() {
  if (!props.electionDate) return;

  const electionDate = new Date(props.electionDate);
  
  // Nomination dates (60 days before, 30 days before)
  if (props.electionType !== 'referendum') {
    const nominationOpen = new Date(electionDate);
    nominationOpen.setDate(nominationOpen.getDate() - 60);
    emit('update:nominationOpenDate', nominationOpen);

    const nominationClose = new Date(electionDate);
    nominationClose.setDate(nominationClose.getDate() - 30);
    emit('update:nominationCloseDate', nominationClose);
  }

  // Party list deadline (45 days before)
  if (props.electionType === 'general_election') {
    const partyDeadline = new Date(electionDate);
    partyDeadline.setDate(partyDeadline.getDate() - 45);
    emit('update:partyListDeadline', partyDeadline);
  }

  // Observer dates
  const observerCall = new Date(electionDate);
  observerCall.setDate(observerCall.getDate() - 45);
  emit('update:observerCallDate', observerCall);

  const observerApp = new Date(electionDate);
  observerApp.setDate(observerApp.getDate() - 30);
  emit('update:observerAppDeadline', observerApp);

  const observerReview = new Date(electionDate);
  observerReview.setDate(observerReview.getDate() - 14);
  emit('update:observerReviewDeadline', observerReview);

  // Tallying dates
  emit('update:tallyingStartDate', new Date(electionDate));
  
  const tallyingEnd = new Date(electionDate);
  tallyingEnd.setDate(tallyingEnd.getDate() + 3);
  emit('update:tallyingEndDate', tallyingEnd);

  // Results publish (1 day after tallying end)
  const resultsPublish = new Date(tallyingEnd);
  resultsPublish.setDate(resultsPublish.getDate() + 1);
  emit('update:resultsPublishDate', resultsPublish);
}

// Auto-fill when election date changes
watch(
  () => props.electionDate,
  (newDate) => {
    if (newDate && !props.tallyingStartDate) {
      autoFillDates();
    }
  }
);
</script>

