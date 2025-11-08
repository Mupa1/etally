<template>
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="flex items-center"
        :class="{ 'flex-1': index < steps.length - 1 }"
      >
        <div class="flex flex-col items-center">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
            :class="getStepClass(index)"
          >
            {{ index + 1 }}
          </div>
          <span class="text-xs mt-2 text-gray-600">{{ step }}</span>
        </div>
        <div
          v-if="index < steps.length - 1"
          class="flex-1 h-1 mx-4"
          :class="currentStep > index ? 'bg-green-500' : 'bg-gray-300'"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  steps: string[];
  currentStep: number;
}

defineProps<Props>();

function getStepClass(index: number): string {
  const props = defineProps<Props>();
  if (props.currentStep > index) {
    return 'bg-green-500 text-white';
  } else if (props.currentStep === index) {
    return 'bg-blue-500 text-white';
  }
  return 'bg-gray-300 text-gray-600';
}
</script>
