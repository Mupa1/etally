<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div class="virtual-scroll-spacer" :style="{ height: totalHeight + 'px' }">
      <div
        class="virtual-scroll-content"
        :style="{
          transform: `translateY(${offsetY}px)`,
          height: visibleHeight + 'px',
        }"
      >
        <div
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item, startIndex + index)"
          class="virtual-scroll-item"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot :item="item" :index="startIndex + index" :isVisible="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface Props {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  keyField?: string;
}

const props = withDefaults(defineProps<Props>(), {
  overscan: 5,
  keyField: 'id',
});

const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);

// Computed properties for virtual scrolling
const totalHeight = computed(() => props.items.length * props.itemHeight);

const visibleCount = computed(() =>
  Math.ceil(props.containerHeight / props.itemHeight)
);

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight);
  return Math.max(0, index - props.overscan);
});

const endIndex = computed(() => {
  const index = startIndex.value + visibleCount.value + props.overscan * 2;
  return Math.min(props.items.length - 1, index);
});

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1);
});

const offsetY = computed(() => startIndex.value * props.itemHeight);

const visibleHeight = computed(() => {
  return (endIndex.value - startIndex.value + 1) * props.itemHeight;
});

// Get unique key for each item
function getItemKey(item: any, index: number): string | number {
  if (props.keyField && item[props.keyField]) {
    return item[props.keyField];
  }
  return index;
}

// Handle scroll events
function handleScroll(event: Event) {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
}

// Expose methods for external control
function scrollToIndex(index: number) {
  if (containerRef.value) {
    const targetScrollTop = index * props.itemHeight;
    containerRef.value.scrollTop = targetScrollTop;
  }
}

function scrollToTop() {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0;
  }
}

function scrollToBottom() {
  if (containerRef.value) {
    containerRef.value.scrollTop = totalHeight.value - props.containerHeight;
  }
}

// Expose methods
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  scrollTop,
  startIndex,
  endIndex,
  visibleItems,
});
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  position: relative;
  width: 100%;
}

.virtual-scroll-spacer {
  position: relative;
  width: 100%;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-scroll-item {
  width: 100%;
  box-sizing: border-box;
}
</style>
