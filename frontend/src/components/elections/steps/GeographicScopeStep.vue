<template>
  <div class="geographic-scope-step">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Geographic Scope</h2>
    <p class="text-gray-600 mb-6">
      <span v-if="electionType === 'general_election' || electionType === 'referendum'">
        This election covers all areas nationwide. No selection needed.
      </span>
      <span v-else-if="electionType === 'by_election'">
        Select the specific geographic area for this by-election.
      </span>
      <span v-else>
        Configure the geographic coverage for this election.
      </span>
    </p>

    <!-- National Coverage (General Election, Referendum) -->
    <div
      v-if="electionType === 'general_election' || electionType === 'referendum'"
      class="bg-green-50 border border-green-200 rounded-lg p-6"
    >
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-green-800">National Coverage</h3>
      </div>
      <div class="text-sm text-green-700 space-y-1">
        <p><strong>Coverage:</strong> All 47 counties, 290 constituencies, and ~1,450 wards</p>
        <p><strong>Polling Stations:</strong> All active polling stations nationwide</p>
      </div>
    </div>

    <!-- By-Election: Specific Area Selection -->
    <div v-else-if="electionType === 'by_election'" class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p class="text-sm text-blue-800">
          <strong>Note:</strong> The geographic level depends on the position type. 
          For example, MP requires a constituency, MCA requires a ward, and Governor requires a county.
        </p>
      </div>

      <div class="space-y-4">
        <!-- County Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            County
          </label>
          <select
            :value="countyId || ''"
            @change="handleCountyChange($event)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a county...</option>
            <!-- Options will be loaded dynamically -->
          </select>
        </div>

        <!-- Constituency Selection (if county selected) -->
        <div v-if="countyId">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Constituency
          </label>
          <select
            :value="constituencyId || ''"
            @change="handleConstituencyChange($event)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a constituency...</option>
            <!-- Options will be loaded dynamically -->
          </select>
        </div>

        <!-- Ward Selection (if constituency selected) -->
        <div v-if="constituencyId">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Ward
          </label>
          <select
            :value="wardId || ''"
            @change="handleWardChange($event)"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a ward...</option>
            <!-- Options will be loaded dynamically -->
          </select>
        </div>
      </div>

      <!-- Selected Area Summary -->
      <div v-if="countyId || constituencyId || wardId" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 class="font-semibold text-gray-800 mb-2">Selected Area:</h4>
        <div class="text-sm text-gray-600 space-y-1">
          <p v-if="countyId"><strong>County:</strong> {{ getCountyName() }}</p>
          <p v-if="constituencyId"><strong>Constituency:</strong> {{ getConstituencyName() }}</p>
          <p v-if="wardId"><strong>Ward:</strong> {{ getWardName() }}</p>
        </div>
      </div>
    </div>

    <!-- Placeholder for other types -->
    <div v-else class="text-center py-8 text-gray-500">
      Geographic scope configuration for this election type will be available soon.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/utils/api';

interface Props {
  countyId: string | null;
  constituencyId: string | null;
  wardId: string | null;
  electionType: string | null;
  contests: any[];
}

interface Emits {
  (e: 'update:countyId', value: string | null): void;
  (e: 'update:constituencyId', value: string | null): void;
  (e: 'update:wardId', value: string | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const counties = ref<any[]>([]);
const constituencies = ref<any[]>([]);
const wards = ref<any[]>([]);

// Load counties on mount (for by-elections)
// TODO: Implement actual API calls

function handleCountyChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:countyId', target.value || null);
  emit('update:constituencyId', null);
  emit('update:wardId', null);
  // TODO: Load constituencies for selected county
}

function handleConstituencyChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:constituencyId', target.value || null);
  emit('update:wardId', null);
  // TODO: Load wards for selected constituency
}

function handleWardChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:wardId', target.value || null);
}

function getCountyName(): string {
  // TODO: Get from loaded counties
  return 'Loading...';
}

function getConstituencyName(): string {
  // TODO: Get from loaded constituencies
  return 'Loading...';
}

function getWardName(): string {
  // TODO: Get from loaded wards
  return 'Loading...';
}
</script>

