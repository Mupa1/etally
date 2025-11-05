<template>
  <div class="space-y-4">
    <!-- County Selection -->
    <FormField
      v-model="localCountyId"
      type="select"
      :label="countyLabel"
      @update:modelValue="handleCountyChange"
    >
      <option value="">{{ countyPlaceholder }}</option>
      <option v-for="county in counties" :key="county.id" :value="county.id">
        {{ county.name }}
      </option>
    </FormField>

    <!-- Constituency Selection -->
    <FormField
      v-if="localCountyId"
      v-model="localConstituencyId"
      type="select"
      :label="constituencyLabel"
      :disabled="loadingConstituencies"
      @update:modelValue="handleConstituencyChange"
    >
      <option value="">
        {{
          loadingConstituencies
            ? 'Loading constituencies...'
            : constituencyPlaceholder
        }}
      </option>
      <option
        v-for="constituency in constituencies"
        :key="constituency.id"
        :value="constituency.id"
      >
        {{ constituency.name }}
      </option>
    </FormField>

    <!-- Ward Selection -->
    <FormField
      v-if="localConstituencyId"
      v-model="localWardId"
      type="select"
      :label="wardLabel"
      :disabled="loadingWards"
      @update:modelValue="handleWardChange"
    >
      <option value="">
        {{ loadingWards ? 'Loading wards...' : wardPlaceholder }}
      </option>
      <option v-for="ward in wards" :key="ward.id" :value="ward.id">
        {{ ward.name }}
      </option>
    </FormField>

    <!-- Polling Station Selection -->
    <FormField
      v-if="localWardId && showPollingStations"
      v-model="localStationId"
      type="select"
      :label="stationLabel"
      :disabled="loadingStations"
      @update:modelValue="handleStationChange"
    >
      <option value="">
        {{ loadingStations ? 'Loading stations...' : stationPlaceholder }}
      </option>
      <option
        v-for="station in pollingStations"
        :key="station.id"
        :value="station.id"
      >
        {{ station.name }} ({{ station.code }})
      </option>
    </FormField>

    <!-- Station Info -->
    <p v-if="localStationId && selectedStation" class="text-xs text-gray-500">
      Registered Voters:
      {{ selectedStation.registeredVoters?.toLocaleString() }}
    </p>

    <!-- Help Text -->
    <div
      v-if="showHelpText"
      class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800"
    >
      <p class="font-medium mb-1">ℹ️ Note:</p>
      <p>{{ helpText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import api, { getAgentApiBaseUrl } from '@/utils/api';
import FormField from './FormField.vue';

interface Geographic {
  id: string;
  name: string;
  code?: string;
  registeredVoters?: number;
}

interface Props {
  countyId?: string;
  constituencyId?: string;
  wardId?: string;
  stationId?: string;
  showPollingStations?: boolean;
  countyLabel?: string;
  constituencyLabel?: string;
  wardLabel?: string;
  stationLabel?: string;
  countyPlaceholder?: string;
  constituencyPlaceholder?: string;
  wardPlaceholder?: string;
  stationPlaceholder?: string;
  showHelpText?: boolean;
  helpText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showPollingStations: true,
  countyLabel: 'Preferred County',
  constituencyLabel: 'Preferred Constituency',
  wardLabel: 'Preferred Ward',
  stationLabel: 'Preferred Polling Station',
  countyPlaceholder: 'Select county (optional)...',
  constituencyPlaceholder: 'Select constituency (optional)...',
  wardPlaceholder: 'Select ward (optional)...',
  stationPlaceholder: 'Select polling station (optional)...',
  showHelpText: true,
  helpText:
    "You don't have to select a specific polling station. You can stop at county, constituency, or ward level. Final assignment will be made by election administrators based on coverage needs.",
});

const emit = defineEmits<{
  (e: 'update:countyId', value: string): void;
  (e: 'update:constituencyId', value: string): void;
  (e: 'update:wardId', value: string): void;
  (e: 'update:stationId', value: string): void;
}>();

// Local state
const localCountyId = ref(props.countyId || '');
const localConstituencyId = ref(props.constituencyId || '');
const localWardId = ref(props.wardId || '');
const localStationId = ref(props.stationId || '');

// Data arrays
const counties = ref<Geographic[]>([]);
const constituencies = ref<Geographic[]>([]);
const wards = ref<Geographic[]>([]);
const pollingStations = ref<Geographic[]>([]);

// Loading states
const loadingConstituencies = ref(false);
const loadingWards = ref(false);
const loadingStations = ref(false);

// Computed
const selectedStation = computed(() => {
  return pollingStations.value.find((s) => s.id === localStationId.value);
});

// Load counties on mount
(async () => {
  try {
    // Use full URL to bypass baseURL (agent endpoints are at /api/agent, not /api/v1)
    const response = await api.get('/agent/geographic/counties', {
      baseURL: getAgentApiBaseUrl(),
    });
    if (response.data.success) {
      counties.value = response.data.data;
    }
  } catch (err) {
    console.error('Failed to load counties:', err);
  }
})();

// Watch for external changes
watch(
  () => props.countyId,
  (val) => {
    localCountyId.value = val || '';
  }
);
watch(
  () => props.constituencyId,
  (val) => {
    localConstituencyId.value = val || '';
  }
);
watch(
  () => props.wardId,
  (val) => {
    localWardId.value = val || '';
  }
);
watch(
  () => props.stationId,
  (val) => {
    localStationId.value = val || '';
  }
);

async function handleCountyChange(value: string) {
  localCountyId.value = value;
  localConstituencyId.value = '';
  localWardId.value = '';
  localStationId.value = '';
  constituencies.value = [];
  wards.value = [];
  pollingStations.value = [];

  emit('update:countyId', value);
  emit('update:constituencyId', '');
  emit('update:wardId', '');
  emit('update:stationId', '');

  if (!value) return;

  loadingConstituencies.value = true;
  try {
    const response = await api.get(
      `/agent/geographic/constituencies?countyId=${value}`,
      {
        baseURL: getAgentApiBaseUrl(),
      }
    );
    if (response.data.success) {
      constituencies.value = response.data.data;
    }
  } catch (err) {
    console.error('Failed to load constituencies:', err);
  } finally {
    loadingConstituencies.value = false;
  }
}

async function handleConstituencyChange(value: string) {
  localConstituencyId.value = value;
  localWardId.value = '';
  localStationId.value = '';
  wards.value = [];
  pollingStations.value = [];

  emit('update:constituencyId', value);
  emit('update:wardId', '');
  emit('update:stationId', '');

  if (!value) return;

  loadingWards.value = true;
  try {
    const response = await api.get(
      `/agent/geographic/wards?constituencyId=${value}`,
      {
        baseURL: getAgentApiBaseUrl(),
      }
    );
    if (response.data.success) {
      wards.value = response.data.data;
    }
  } catch (err) {
    console.error('Failed to load wards:', err);
  } finally {
    loadingWards.value = false;
  }
}

async function handleWardChange(value: string) {
  localWardId.value = value;
  localStationId.value = '';
  pollingStations.value = [];

  emit('update:wardId', value);
  emit('update:stationId', '');

  if (!value || !props.showPollingStations) return;

  loadingStations.value = true;
  try {
    const response = await api.get(
      `/agent/geographic/polling-stations?wardId=${value}`,
      {
        baseURL: getAgentApiBaseUrl(),
      }
    );
    if (response.data.success) {
      pollingStations.value = response.data.data;
    }
  } catch (err) {
    console.error('Failed to load polling stations:', err);
  } finally {
    loadingStations.value = false;
  }
}

function handleStationChange(value: string) {
  localStationId.value = value;
  emit('update:stationId', value);
}
</script>
