<template>
  <MenuItem v-slot="{ active }">
    <component
      :is="href ? 'a' : 'button'"
      :href="href"
      :type="href ? undefined : 'button'"
      @click="handleClick"
      :class="[
        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
        'block w-full text-left px-4 py-3 text-sm',
        'min-h-[44px] sm:min-h-[36px]',
        'touch-manipulation',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        variant === 'danger' ? 'text-red-700' : '',
      ]"
      :disabled="disabled"
    >
      <div class="flex items-center gap-2">
        <component v-if="icon" :is="icon" class="w-4 h-4" />
        <slot />
      </div>
    </component>
  </MenuItem>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue';
import type { Component } from 'vue';

interface Props {
  href?: string;
  icon?: Component;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'click'): void;
}>();

function handleClick() {
  emit('click');
}
</script>
