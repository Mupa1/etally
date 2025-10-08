<template>
  <div
    :class="[
      'flex flex-col items-center justify-center text-center',
      // Mobile: More padding
      'px-4 py-12 sm:px-6 sm:py-16',
    ]"
  >
    <!-- Icon or Custom Content -->
    <div
      v-if="$slots.icon || icon"
      :class="[
        'mb-4 sm:mb-6',
        // Mobile: Larger icon for visibility
        'w-16 h-16 sm:w-12 sm:h-12',
        'text-gray-400',
      ]"
    >
      <slot name="icon">
        <component :is="iconComponent" class="w-full h-full" />
      </slot>
    </div>

    <!-- Title -->
    <h3
      :class="[
        'font-semibold text-gray-900 mb-2',
        // Mobile: Larger text
        'text-lg sm:text-base',
      ]"
    >
      <slot name="title">{{ title }}</slot>
    </h3>

    <!-- Description -->
    <p
      :class="[
        'text-gray-600 mb-6 sm:mb-8 max-w-sm',
        // Mobile: Larger text for readability
        'text-base sm:text-sm',
      ]"
    >
      <slot name="description">{{ description }}</slot>
    </p>

    <!-- Action Button - Mobile Optimized -->
    <div v-if="$slots.action || actionLabel" class="w-full sm:w-auto">
      <slot name="action">
        <Button
          v-if="actionLabel"
          :variant="actionVariant"
          :leading-icon="actionIcon"
          :full-width="fullWidthAction"
          @click="handleAction"
        >
          {{ actionLabel }}
        </Button>
      </slot>
    </div>

    <!-- Secondary Action (Optional) -->
    <div v-if="secondaryLabel" class="mt-3 w-full sm:w-auto">
      <Button
        variant="ghost"
        :full-width="fullWidthAction"
        @click="handleSecondaryAction"
      >
        {{ secondaryLabel }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue';
import Button from './Button.vue';
import type { Component } from 'vue';

type IconType = 'inbox' | 'search' | 'folder' | 'document' | 'users' | 'chart';

interface Props {
  icon?: IconType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionVariant?: 'primary' | 'secondary' | 'success';
  actionIcon?: Component;
  secondaryLabel?: string;
  fullWidthAction?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'No data found',
  description: 'Get started by creating a new item',
  actionVariant: 'primary',
  fullWidthAction: true, // Mobile: full-width by default
});

const emit = defineEmits<{
  (e: 'action'): void;
  (e: 'secondary-action'): void;
}>();

// Default icon components
const InboxIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  `,
});

const SearchIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  `,
});

const FolderIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  `,
});

const DocumentIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  `,
});

const UsersIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  `,
});

const ChartIcon = markRaw({
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  `,
});

const iconComponent = computed(() => {
  const icons = {
    inbox: InboxIcon,
    search: SearchIcon,
    folder: FolderIcon,
    document: DocumentIcon,
    users: UsersIcon,
    chart: ChartIcon,
  };
  return props.icon ? icons[props.icon] : InboxIcon;
});

function handleAction() {
  emit('action');
}

function handleSecondaryAction() {
  emit('secondary-action');
}
</script>
