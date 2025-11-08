<template>
  <div class="loading-skeleton" :class="variant">
    <!-- Card skeleton -->
    <div v-if="variant === 'card'" class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-circle"></div>
        <div class="skeleton-text skeleton-text--title"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton-text skeleton-text--line"></div>
        <div
          class="skeleton-text skeleton-text--line skeleton-text--short"
        ></div>
        <div class="skeleton-text skeleton-text--line"></div>
      </div>
    </div>

    <!-- Form skeleton -->
    <div v-else-if="variant === 'form'" class="skeleton-form">
      <div class="skeleton-field">
        <div class="skeleton-text skeleton-text--label"></div>
        <div class="skeleton-input"></div>
      </div>
      <div class="skeleton-field">
        <div class="skeleton-text skeleton-text--label"></div>
        <div class="skeleton-input"></div>
      </div>
      <div class="skeleton-field">
        <div class="skeleton-text skeleton-text--label"></div>
        <div class="skeleton-textarea"></div>
      </div>
      <div class="skeleton-button"></div>
    </div>

    <!-- List skeleton -->
    <div v-else-if="variant === 'list'" class="skeleton-list">
      <div v-for="i in lines" :key="i" class="skeleton-list-item">
        <div class="skeleton-circle"></div>
        <div class="skeleton-text skeleton-text--line"></div>
      </div>
    </div>

    <!-- Table skeleton -->
    <div v-else-if="variant === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div class="skeleton-text skeleton-text--header"></div>
        <div class="skeleton-text skeleton-text--header"></div>
        <div class="skeleton-text skeleton-text--header"></div>
      </div>
      <div v-for="i in rows" :key="i" class="skeleton-table-row">
        <div class="skeleton-text skeleton-text--cell"></div>
        <div class="skeleton-text skeleton-text--cell"></div>
        <div class="skeleton-text skeleton-text--cell"></div>
      </div>
    </div>

    <!-- Default skeleton -->
    <div v-else class="skeleton-default">
      <div class="skeleton-text skeleton-text--line"></div>
      <div class="skeleton-text skeleton-text--line skeleton-text--short"></div>
      <div class="skeleton-text skeleton-text--line"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'card' | 'form' | 'list' | 'table' | 'default';
  lines?: number;
  rows?: number;
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  lines: 3,
  rows: 5,
  animated: true,
});
</script>

<style scoped>
.loading-skeleton {
  width: 100%;
}

.skeleton-card {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
}

.skeleton-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.skeleton-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: #f3f4f6;
  margin-right: 0.75rem;
}

.skeleton-content {
  space-y: 0.5rem;
}

.skeleton-form {
  space-y: 1.5rem;
}

.skeleton-field {
  space-y: 0.5rem;
}

.skeleton-input,
.skeleton-textarea {
  height: 2.5rem;
  border-radius: 0.375rem;
  background: #f3f4f6;
}

.skeleton-textarea {
  height: 6rem;
}

.skeleton-button {
  height: 2.75rem;
  border-radius: 0.375rem;
  background: #f3f4f6;
  width: 8rem;
}

.skeleton-list {
  space-y: 1rem;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  space-x: 0.75rem;
}

.skeleton-table {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.skeleton-table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.skeleton-table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.skeleton-text {
  background: #f3f4f6;
  border-radius: 0.25rem;
  height: 1rem;
}

.skeleton-text--title {
  height: 1.25rem;
  width: 60%;
}

.skeleton-text--label {
  height: 0.875rem;
  width: 40%;
}

.skeleton-text--header {
  height: 1rem;
  width: 80%;
}

.skeleton-text--cell {
  height: 0.875rem;
  width: 70%;
}

.skeleton-text--line {
  width: 100%;
}

.skeleton-text--short {
  width: 60%;
}

/* Animation */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton-text,
.skeleton-input,
.skeleton-textarea,
.skeleton-button,
.skeleton-circle {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .skeleton-table-header,
  .skeleton-table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .skeleton-card {
    padding: 1rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .skeleton-text,
  .skeleton-input,
  .skeleton-textarea,
  .skeleton-button,
  .skeleton-circle {
    animation: none;
    background: #f3f4f6;
  }
}
</style>
