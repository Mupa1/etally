<template>
  <div class="wizard">
    <!-- Progress Steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex items-center"
          :class="{ 'flex-1': index < steps.length - 1 }"
        >
          <div class="flex flex-col items-center cursor-pointer" @click="goToStep(index)">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors"
              :class="getStepClass(index)"
            >
              <svg
                v-if="currentStep > index"
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="text-xs mt-2 text-gray-600 text-center max-w-[80px]">
              {{ step.label }}
            </span>
          </div>
          <div
            v-if="index < steps.length - 1"
            class="flex-1 h-1 mx-4 transition-colors"
            :class="currentStep > index ? 'bg-green-500' : 'bg-gray-300'"
          ></div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="wizard-content">
      <slot :step="currentStep" :data="formData" />
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between mt-8 pt-6 border-t border-gray-200">
      <Button
        v-if="currentStep > 0"
        type="button"
        variant="secondary"
        @click="handlePrevious"
        :disabled="loading"
      >
        Previous
      </Button>
      <div v-else></div>

      <div class="flex gap-3">
        <Button
          v-if="currentStep < steps.length - 1"
          type="button"
          variant="primary"
          @click="handleNext"
          :disabled="!canProceed || loading"
          :loading="loading"
        >
          Next
        </Button>
        <Button
          v-else
          type="button"
          variant="success"
          @click="handleFinish"
          :disabled="!canFinish || loading"
          :loading="loading"
        >
          {{ finishLabel }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from './Button.vue';

export interface WizardStep {
  label: string;
  key: string;
}

interface Props {
  steps: WizardStep[];
  initialStep?: number;
  finishLabel?: string;
  loading?: boolean;
}

interface Emits {
  (e: 'update:step', step: number): void;
  (e: 'next', step: number, data: any): void;
  (e: 'previous', step: number): void;
  (e: 'finish', data: any): void;
  (e: 'step-change', step: number, previousStep: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  initialStep: 0,
  finishLabel: 'Finish',
  loading: false,
});

const emit = defineEmits<Emits>();

const currentStep = ref(props.initialStep);
const formData = ref<any>({});

const canProceed = computed(() => {
  // Can be overridden by parent component via prop or slot
  return true;
});

const canFinish = computed(() => {
  // Can be overridden by parent component via prop or slot
  return true;
});

// Expose for parent component access
defineExpose({
  currentStep,
  formData,
  goToStep,
});

function getStepClass(index: number): string {
  if (currentStep.value > index) {
    return 'bg-green-500 text-white';
  } else if (currentStep.value === index) {
    return 'bg-blue-600 text-white ring-2 ring-blue-300';
  }
  return 'bg-gray-300 text-gray-600';
}

function goToStep(index: number) {
  if (index < 0 || index >= props.steps.length) return;
  
  const previousStep = currentStep.value;
  currentStep.value = index;
  emit('step-change', index, previousStep);
  emit('update:step', index);
}

function handleNext() {
  if (currentStep.value < props.steps.length - 1) {
    const previousStep = currentStep.value;
    currentStep.value++;
    emit('next', currentStep.value, formData.value);
    emit('step-change', currentStep.value, previousStep);
    emit('update:step', currentStep.value);
  }
}

function handlePrevious() {
  if (currentStep.value > 0) {
    const previousStep = currentStep.value;
    currentStep.value--;
    emit('previous', currentStep.value);
    emit('step-change', currentStep.value, previousStep);
    emit('update:step', currentStep.value);
  }
}

function handleFinish() {
  emit('finish', formData.value);
}
</script>

<style scoped>
.wizard {
  @apply w-full;
}

.wizard-content {
  @apply min-h-[400px];
}
</style>

