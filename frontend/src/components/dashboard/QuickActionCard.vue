<template>
  <router-link
    :to="to"
    class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
  >
    <div
      class="w-6 h-6 text-primary-600 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform"
    >
      <component :is="iconComponent" class="w-6 h-6" />
    </div>
    <div>
      <p class="font-medium text-gray-900 group-hover:text-primary-700">
        {{ title }}
      </p>
      <p class="text-sm text-gray-500">{{ description }}</p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PlusIcon, UserAddIcon, ChartIcon } from '@/components/icons';

type IconType = 'plus' | 'user-add' | 'chart';

interface Props {
  title: string;
  description: string;
  to: string;
  icon: IconType;
}

const props = defineProps<Props>();

const iconComponent = computed(() => {
  const icons = {
    plus: PlusIcon,
    'user-add': UserAddIcon,
    chart: ChartIcon,
  };
  return icons[props.icon];
});
</script>
