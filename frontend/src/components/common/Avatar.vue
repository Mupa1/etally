<template>
  <div
    :class="[
      'relative inline-flex items-center justify-center flex-shrink-0 overflow-hidden',
      sizeClass,
      rounded ? 'rounded-full' : 'rounded-lg',
      backgroundClass,
    ]"
  >
    <!-- Image -->
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover"
      @error="handleImageError"
    />

    <!-- Initials -->
    <span
      v-else-if="computedInitials"
      :class="['font-semibold select-none', textSizeClass, textColorClass]"
    >
      {{ computedInitials }}
    </span>

    <!-- Fallback Icon -->
    <svg
      v-else
      :class="['text-gray-400', iconSizeClass]"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clip-rule="evenodd"
      />
    </svg>

    <!-- Status Indicator -->
    <span
      v-if="status"
      :class="[
        'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
        statusSizeClass,
        statusColorClass,
      ]"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { User } from '@/types/auth';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type Color =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'gray';
type Status = 'online' | 'offline' | 'away' | 'busy';

interface Props {
  user?: User | null;
  src?: string;
  initials?: string;
  alt?: string;
  size?: Size;
  color?: Color;
  rounded?: boolean;
  status?: Status;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  rounded: true,
  alt: 'User avatar',
});

const imageError = ref(false);

const computedInitials = computed(() => {
  if (props.initials) return props.initials.toUpperCase();

  if (props.user) {
    const first = props.user.firstName?.[0] || '';
    const last = props.user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  }

  return null;
});

const sizeClass = computed(() => {
  const sizes = {
    xs: 'w-6 h-6 sm:w-6 sm:h-6',
    sm: 'w-8 h-8 sm:w-8 sm:h-8',
    md: 'w-10 h-10 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-12 sm:h-12',
    xl: 'w-16 h-16 sm:w-14 sm:h-14',
    '2xl': 'w-20 h-20 sm:w-16 sm:h-16',
  };
  return sizes[props.size];
});

const textSizeClass = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };
  return sizes[props.size];
});

const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
    '2xl': 'w-12 h-12',
  };
  return sizes[props.size];
});

const backgroundClass = computed(() => {
  const backgrounds = {
    primary: 'bg-primary-100',
    secondary: 'bg-secondary-100',
    success: 'bg-success-100',
    danger: 'bg-danger-100',
    warning: 'bg-warning-100',
    gray: 'bg-gray-100',
  };
  return backgrounds[props.color];
});

const textColorClass = computed(() => {
  const colors = {
    primary: 'text-primary-700',
    secondary: 'text-secondary-700',
    success: 'text-success-700',
    danger: 'text-danger-700',
    warning: 'text-warning-700',
    gray: 'text-gray-700',
  };
  return colors[props.color];
});

const statusSizeClass = computed(() => {
  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
  };
  return sizes[props.size];
});

const statusColorClass = computed(() => {
  const colors = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    away: 'bg-warning-500',
    busy: 'bg-danger-500',
  };
  return props.status ? colors[props.status] : '';
});

function handleImageError() {
  imageError.value = true;
}
</script>
