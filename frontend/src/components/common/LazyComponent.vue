<template>
  <div ref="containerRef" class="lazy-component">
    <div v-if="isVisible" class="lazy-content">
      <slot />
    </div>
    <div v-else class="lazy-placeholder">
      <div
        class="animate-pulse bg-gray-200 rounded-lg h-32 flex items-center justify-center"
      >
        <svg
          class="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 0.1,
  rootMargin: '50px',
  once: true,
});

const containerRef = ref<HTMLElement>();
const isVisible = ref(false);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!containerRef.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true;

          if (props.once && observer) {
            observer.unobserve(entry.target);
          }
        } else if (!props.once) {
          isVisible.value = false;
        }
      });
    },
    {
      threshold: props.threshold,
      rootMargin: props.rootMargin,
    }
  );

  observer.observe(containerRef.value);
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.lazy-component {
  min-height: 100px;
}

.lazy-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.lazy-content {
  width: 100%;
}
</style>
