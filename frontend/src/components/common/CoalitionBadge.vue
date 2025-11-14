<template>
  <span
    v-if="hasCoalition"
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      badgeClass,
    ]"
    :title="coalitionTooltip"
  >
    <svg
      class="w-3 h-3 mr-1"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clip-rule="evenodd"
      />
    </svg>
    {{ coalitionName }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Coalition {
  id: string;
  name: string;
  abbreviation?: string;
  isCompetitor?: boolean;
  isActive?: boolean;
}

interface Props {
  coalitions?: Coalition[];
  showCompetitor?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  coalitions: () => [],
  showCompetitor: false,
});

// Get first active coalition that is not a competitor (unless showCompetitor is true)
const activeCoalition = computed(() => {
  if (!props.coalitions || props.coalitions.length === 0) return null;
  
  // Filter active coalitions
  const active = props.coalitions.filter((c) => c.isActive);
  
  // If showCompetitor is true, show any coalition; otherwise, only show friendly coalitions
  const friendly = active.filter((c) => !c.isCompetitor);
  const eligible = props.showCompetitor ? active : friendly;
  
  return eligible.length > 0 ? eligible[0] : null;
});

const hasCoalition = computed(() => activeCoalition.value !== null);

const coalitionName = computed(() => {
  const coalition = activeCoalition.value;
  return coalition?.abbreviation || coalition?.name || 'Coalition';
});

const coalitionTooltip = computed(() => {
  const coalition = activeCoalition.value;
  if (!coalition) return '';
  
  const type = coalition.isCompetitor ? 'Competitor' : 'Friendly';
  return `${coalition.name} (${type} Coalition)`;
});

const badgeClass = computed(() => {
  const coalition = activeCoalition.value;
  if (!coalition) return '';
  
  // Green badge for friendly coalitions, red/orange for competitor coalitions
  if (coalition.isCompetitor) {
    return 'bg-orange-100 text-orange-800 border border-orange-200';
  }
  return 'bg-green-100 text-green-800 border border-green-200';
});
</script>

