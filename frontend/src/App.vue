<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

onMounted(async () => {
  // Initialize app - don't block on errors
  try {
    await authStore.initialize();
  } catch (error) {
    console.log('Auth initialization skipped:', error);
  }
});
</script>

<style>
/* Global styles loaded from main.css */
</style>
