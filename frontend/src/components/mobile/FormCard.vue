<template>
  <div class="bg-white shadow-md rounded-lg p-6">
    <h2 v-if="title" class="text-xl font-semibold mb-4">{{ title }}</h2>
    <p v-if="description" class="text-sm text-gray-600 mb-4">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
}

defineProps<Props>();
</script>
