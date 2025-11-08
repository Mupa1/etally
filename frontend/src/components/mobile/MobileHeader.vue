<template>
  <div class="bg-blue-600 text-white p-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-blue-100">{{ subtitle }}</p>
      </div>
      <slot name="actions">
        <button
          v-if="showLogout"
          @click="$emit('logout')"
          class="px-3 py-1 bg-blue-700 rounded-md text-sm hover:bg-blue-800"
        >
          Logout
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

withDefaults(defineProps<Props>(), {
  showLogout: true,
});

defineEmits<{
  (e: 'logout'): void;
}>();
</script>
