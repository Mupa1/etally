<template>
  <div class="geographic-scope-selector space-y-6">
    <!-- Scope Level Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Election Coverage Level <span class="text-red-500">*</span>
      </label>
      <Select
        v-model="localScopeLevel"
        :options="scopeLevelOptions"
        placeholder="Select coverage level..."
        @update:model-value="handleScopeLevelChange"
      />
      <p class="text-xs text-gray-500 mt-1">
        Select the geographic level this election will cover
      </p>
    </div>

    <!-- Nationwide - No selection needed -->
    <div
      v-if="localScopeLevel === 'nationwide'"
      class="bg-green-50 border border-green-200 rounded-lg p-4"
    >
      <div class="flex items-center mb-2">
        <svg
          class="w-5 h-5 text-green-600 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h4 class="font-semibold text-green-800">Nationwide Coverage</h4>
      </div>
      <p class="text-sm text-green-700">
        This election will cover all counties, constituencies, and wards nationwide.
      </p>
    </div>

    <!-- County-wide Selection -->
    <div v-else-if="localScopeLevel === 'county'" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select County <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="localCountyId"
          :options="countyOptions"
          placeholder="Select a county..."
          @update:model-value="handleCountyChange"
        />
      </div>

      <div
        v-if="localCountyId && selectedCounty"
        class="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h4 class="font-semibold text-blue-800 mb-2">Selected Coverage:</h4>
        <p class="text-sm text-blue-700">
          <strong>County:</strong> {{ selectedCounty.name }}
        </p>
        <p v-if="selectedCounty.totalConstituencies" class="text-xs text-blue-600 mt-1">
          Covers {{ selectedCounty.totalConstituencies }} constituencies
        </p>
      </div>
    </div>

    <!-- Constituency-wide Selection -->
    <div v-else-if="localScopeLevel === 'constituency'" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select County
        </label>
        <Select
          v-model="localCountyId"
          :options="countyOptions"
          :loading="loadingCounties"
          placeholder="Select a county (optional)..."
          @update:model-value="handleCountyChange"
        />
      </div>

      <div v-if="localCountyId || !localConstituencyId">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Constituency <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="localConstituencyId"
          :options="constituencyOptions"
          placeholder="Select a constituency..."
          @update:model-value="handleConstituencyChange"
        />
      </div>

      <div
        v-if="localConstituencyId && selectedConstituency"
        class="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h4 class="font-semibold text-blue-800 mb-2">Selected Coverage:</h4>
        <p class="text-sm text-blue-700">
          <strong>Constituency:</strong> {{ selectedConstituency.name }}
        </p>
        <p v-if="selectedConstituency.countyName" class="text-xs text-blue-600">
          County: {{ selectedConstituency.countyName }}
        </p>
        <p
          v-if="selectedConstituency.totalWards"
          class="text-xs text-blue-600 mt-1"
        >
          Covers {{ selectedConstituency.totalWards }} wards
        </p>
      </div>
    </div>

    <!-- County Assembly-wide (Ward-level) Selection -->
    <div v-else-if="localScopeLevel === 'county_assembly'" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select County
        </label>
        <Select
          v-model="localCountyId"
          :options="countyOptions"
          :loading="loadingCounties"
          placeholder="Select a county (optional)..."
          @update:model-value="handleCountyChange"
        />
      </div>

      <div v-if="localCountyId || !localConstituencyId">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Constituency
        </label>
        <Select
          v-model="localConstituencyId"
          :options="constituencyOptions"
          placeholder="Select a constituency (optional)..."
          @update:model-value="handleConstituencyChange"
        />
      </div>

      <div v-if="localConstituencyId || !localWardId">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Ward <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="localWardId"
          :options="wardOptions"
          placeholder="Select a ward..."
          @update:model-value="handleWardChange"
        />
      </div>

      <div
        v-if="localWardId && selectedWard"
        class="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h4 class="font-semibold text-blue-800 mb-2">Selected Coverage:</h4>
        <p class="text-sm text-blue-700">
          <strong>Ward:</strong> {{ selectedWard.name }}
        </p>
        <p v-if="selectedWard.constituencyName" class="text-xs text-blue-600">
          Constituency: {{ selectedWard.constituencyName }}
        </p>
        <p v-if="selectedWard.countyName" class="text-xs text-blue-600">
          County: {{ selectedWard.countyName }}
        </p>
        <p
          v-if="selectedWard.totalPollingStations"
          class="text-xs text-blue-600 mt-1"
        >
          Covers {{ selectedWard.totalPollingStations }} polling stations
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import api from '@/utils/api';
import Select from './Select.vue';

type ScopeLevel = 'nationwide' | 'county' | 'constituency' | 'county_assembly';

interface HierarchyItem {
  id: string;
  code: string;
  name: string;
  type: 'county' | 'constituency' | 'ward' | 'polling_station';
  totalConstituencies?: number;
  totalWards?: number;
  totalPollingStations?: number;
  countyId?: string;
  countyName?: string;
  constituencyId?: string;
  constituencyName?: string;
  wardId?: string;
  wardName?: string;
}

interface Props {
  scopeLevel?: ScopeLevel | '';
  countyId?: string | null;
  constituencyId?: string | null;
  wardId?: string | null;
  countyName?: string | null;
  constituencyName?: string | null;
  wardName?: string | null;
}

interface Emits {
  (e: 'update:scopeLevel', value: ScopeLevel | ''): void;
  (e: 'update:countyId', value: string | null): void;
  (e: 'update:constituencyId', value: string | null): void;
  (e: 'update:wardId', value: string | null): void;
  (e: 'update:countyName', value: string | null): void;
  (e: 'update:constituencyName', value: string | null): void;
  (e: 'update:wardName', value: string | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  scopeLevel: '',
  countyId: null,
  constituencyId: null,
  wardId: null,
  countyName: null,
  constituencyName: null,
  wardName: null,
});

const emit = defineEmits<Emits>();

// Local state
const localScopeLevel = ref<ScopeLevel | ''>(props.scopeLevel || '');
const localCountyId = ref<string | number>(props.countyId || '');
const localConstituencyId = ref<string | number>(props.constituencyId || '');
const localWardId = ref<string | number>(props.wardId || '');

// Data
const counties = ref<HierarchyItem[]>([]);
const constituencies = ref<HierarchyItem[]>([]);
const wards = ref<HierarchyItem[]>([]);

// Loading states
const loadingCounties = ref(false);
const loadingConstituencies = ref(false);
const loadingWards = ref(false);

// Scope level options
const scopeLevelOptions = [
  { value: 'nationwide', label: 'Nationwide' },
  { value: 'county', label: 'County-wide' },
  { value: 'constituency', label: 'Constituency-wide' },
  { value: 'county_assembly', label: 'County Assembly-wide (Ward-level)' },
];

// Computed options
const countyOptions = computed(() => {
  return [
    { value: '', label: 'Select a county...' },
    ...counties.value.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ];
});

const constituencyOptions = computed(() => {
  const options = constituencies.value.map((c) => ({
    value: c.id,
    label: `${c.name}${c.countyName ? ` (${c.countyName})` : ''}`,
  }));
  return options.length > 0
    ? [{ value: '', label: 'Select a constituency...' }, ...options]
    : [{ value: '', label: 'No constituencies available' }];
});

const wardOptions = computed(() => {
  const options = wards.value.map((w) => ({
    value: w.id,
    label: `${w.name}${w.constituencyName ? ` (${w.constituencyName})` : ''}${
      w.countyName ? `, ${w.countyName}` : ''
    }`,
  }));
  return options.length > 0
    ? [{ value: '', label: 'Select a ward...' }, ...options]
    : [{ value: '', label: 'No wards available' }];
});

// Selected items
const selectedCounty = computed(() => {
  const id = String(localCountyId.value);
  return counties.value.find((c) => c.id === id);
});

const selectedConstituency = computed(() => {
  const id = String(localConstituencyId.value);
  return constituencies.value.find((c) => c.id === id);
});

const selectedWard = computed(() => {
  const id = String(localWardId.value);
  return wards.value.find((w) => w.id === id);
});

// Watch for external changes
watch(
  () => props.scopeLevel,
  (val) => {
    localScopeLevel.value = val || '';
    if (val === 'nationwide') {
      emit('update:countyName', null);
      emit('update:constituencyName', null);
      emit('update:wardName', null);
    }
  }
);

watch(
  () => props.countyId,
  (val) => {
    localCountyId.value = val || '';
    syncSelectedNames();
  }
);

watch(
  () => props.constituencyId,
  (val) => {
    localConstituencyId.value = val || '';
    syncSelectedNames();
  }
);

watch(
  () => props.wardId,
  (val) => {
    localWardId.value = val || '';
    syncSelectedNames();
  }
);

// Load counties
async function loadCounties() {
  loadingCounties.value = true;
  try {
    const response = await api.get('/geographic/hierarchy', {
      params: {
        level: 'county',
        limit: 1000,
      },
    });

    if (response.data.success) {
      counties.value = response.data.data || [];
      syncSelectedNames();
    }
  } catch (err) {
    console.error('Failed to load counties:', err);
    counties.value = [];
  } finally {
    loadingCounties.value = false;
  }
}

// Load constituencies
async function loadConstituencies() {
  if (!localCountyId.value && localScopeLevel.value === 'constituency') {
    // Load all constituencies if no county selected
    loadingConstituencies.value = true;
    try {
      const response = await api.get('/geographic/hierarchy', {
        params: {
          level: 'constituency',
          limit: 1000,
        },
      });

      if (response.data.success) {
        constituencies.value = response.data.data || [];
        syncSelectedNames();
      }
    } catch (err) {
      console.error('Failed to load constituencies:', err);
      constituencies.value = [];
    } finally {
      loadingConstituencies.value = false;
    }
  } else if (localCountyId.value) {
    loadingConstituencies.value = true;
    try {
      const response = await api.get('/geographic/hierarchy', {
        params: {
          level: 'constituency',
          countyId: localCountyId.value,
          limit: 1000,
        },
      });

      if (response.data.success) {
        constituencies.value = response.data.data || [];
        syncSelectedNames();
      }
    } catch (err) {
      console.error('Failed to load constituencies:', err);
      constituencies.value = [];
    } finally {
      loadingConstituencies.value = false;
    }
  }
}

// Load wards
async function loadWards() {
  if (
    !localConstituencyId.value &&
    localScopeLevel.value === 'county_assembly'
  ) {
    // Load all wards if no constituency selected
    loadingWards.value = true;
    try {
      const response = await api.get('/geographic/hierarchy', {
        params: {
          level: 'ward',
          limit: 1000,
        },
      });

      if (response.data.success) {
        wards.value = response.data.data || [];
        syncSelectedNames();
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
      wards.value = [];
    } finally {
      loadingWards.value = false;
    }
  } else if (localConstituencyId.value) {
    loadingWards.value = true;
    try {
      const response = await api.get('/geographic/hierarchy', {
        params: {
          level: 'ward',
          constituencyId: localConstituencyId.value,
          limit: 1000,
        },
      });

      if (response.data.success) {
        wards.value = response.data.data || [];
        syncSelectedNames();
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
      wards.value = [];
    } finally {
      loadingWards.value = false;
    }
  }
}

function syncSelectedNames() {
  const countyId = String(localCountyId.value || '');
  if (countyId) {
    const county = counties.value.find((c) => c.id === countyId);
    if (county?.name !== props.countyName) {
      emit('update:countyName', county?.name || null);
    }
  } else if (props.countyName) {
    emit('update:countyName', null);
  }

  const constituencyId = String(localConstituencyId.value || '');
  if (constituencyId) {
    const constituency = constituencies.value.find(
      (c) => c.id === constituencyId
    );
    if (constituency?.name !== props.constituencyName) {
      emit('update:constituencyName', constituency?.name || null);
    }
  } else if (props.constituencyName) {
    emit('update:constituencyName', null);
  }

  const wardId = String(localWardId.value || '');
  if (wardId) {
    const ward = wards.value.find((w) => w.id === wardId);
    if (ward?.name !== props.wardName) {
      emit('update:wardName', ward?.name || null);
    }
  } else if (props.wardName) {
    emit('update:wardName', null);
  }
}

// Handlers
function handleScopeLevelChange(value: ScopeLevel | '') {
  localScopeLevel.value = value;
  emit('update:scopeLevel', value);

  // Reset selections when level changes
  if (value === 'nationwide') {
    localCountyId.value = '';
    localConstituencyId.value = '';
    localWardId.value = '';
    emit('update:countyId', null);
    emit('update:constituencyId', null);
    emit('update:wardId', null);
    emit('update:countyName', null);
    emit('update:constituencyName', null);
    emit('update:wardName', null);
  } else if (value === 'county') {
    localConstituencyId.value = '';
    localWardId.value = '';
    emit('update:constituencyId', null);
    emit('update:wardId', null);
    emit('update:constituencyName', null);
    emit('update:wardName', null);
    loadCounties();
  } else if (value === 'constituency') {
    localWardId.value = '';
    emit('update:wardId', null);
    emit('update:wardName', null);
    loadCounties();
    loadConstituencies();
  } else if (value === 'county_assembly') {
    loadCounties();
    loadConstituencies();
    loadWards();
  }
}

function handleCountyChange(value: string | number) {
  localCountyId.value = value;
  const stringValue = value ? String(value) : '';
  emit('update:countyId', stringValue || null);

  // Reset dependent selections
  localConstituencyId.value = '';
  localWardId.value = '';
  emit('update:constituencyId', null);
  emit('update:wardId', null);
  emit('update:constituencyName', null);
  emit('update:wardName', null);

  // Load constituencies if needed
  if (
    (localScopeLevel.value === 'constituency' ||
      localScopeLevel.value === 'county_assembly') &&
    stringValue
  ) {
    loadConstituencies();
  }

  const county = counties.value.find((c) => c.id === stringValue);
  emit('update:countyName', county?.name || null);
}

function handleConstituencyChange(value: string | number) {
  localConstituencyId.value = value;
  const stringValue = value ? String(value) : '';
  emit('update:constituencyId', stringValue || null);

  // Reset dependent selections
  localWardId.value = '';
  emit('update:wardId', null);
  emit('update:wardName', null);

  // Load wards if needed
  if (localScopeLevel.value === 'county_assembly' && stringValue) {
    loadWards();
  }

  const constituency = constituencies.value.find((c) => c.id === stringValue);
  emit('update:constituencyName', constituency?.name || null);
}

function handleWardChange(value: string | number) {
  localWardId.value = value;
  const stringValue = value ? String(value) : '';
  emit('update:wardId', stringValue || null);

  const ward = wards.value.find((w) => w.id === stringValue);
  emit('update:wardName', ward?.name || null);
}

// Load initial data
onMounted(() => {
  if (localScopeLevel.value && localScopeLevel.value !== 'nationwide') {
    loadCounties();
    if (localScopeLevel.value === 'constituency' || localScopeLevel.value === 'county_assembly') {
      loadConstituencies();
    }
    if (localScopeLevel.value === 'county_assembly') {
      loadWards();
    }
  }
});
</script>

