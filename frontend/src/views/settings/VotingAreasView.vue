<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
            Voting Areas
          </h1>
          <p class="text-sm sm:text-base text-gray-600 mt-1">
            Manage geographic hierarchy and polling stations
          </p>
        </div>
        <Button variant="primary" @click="showAddModal = true">
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Location
        </Button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Counties"
          :value="stats.counties"
          icon="location"
          color="blue"
        />
        <StatCard
          title="Constituencies"
          :value="stats.constituencies"
          icon="location"
          color="green"
        />
        <StatCard
          title="Wards"
          :value="stats.wards"
          icon="location"
          color="purple"
        />
        <StatCard
          title="Polling Stations"
          :value="stats.pollingStations"
          icon="location"
          color="orange"
        />
      </div>

      <!-- Filters and Search -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="sm:col-span-2">
            <SearchBar
              v-model="searchQuery"
              placeholder="Search by name or code..."
              @search="handleSearch"
            />
          </div>

          <!-- Level Filter -->
          <Select
            v-model="selectedLevel"
            label=""
            :options="levelOptions"
            @update:modelValue="handleLevelChange"
          />

          <!-- County Filter -->
          <Select
            v-model="selectedCounty"
            label=""
            :options="countyOptions"
            @update:modelValue="handleCountyChange"
            :disabled="!selectedLevel || selectedLevel === 'all'"
          />
        </div>

        <!-- Breadcrumb Navigation -->
        <div
          v-if="breadcrumbs.length > 0"
          class="flex items-center space-x-2 text-sm"
        >
          <button
            v-for="(crumb, index) in breadcrumbs"
            :key="index"
            @click="navigateTo(crumb)"
            class="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
          >
            <span>{{ crumb.label }}</span>
            <svg
              v-if="index < breadcrumbs.length - 1"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error State -->
      <Alert
        v-else-if="error"
        type="error"
        :message="error"
        @dismiss="error = null"
      />

      <!-- Empty State -->
      <EmptyState
        v-else-if="filteredData.length === 0"
        title="No voting areas found"
        message="Try adjusting your search or filters"
        icon="location"
      />

      <!-- Data Table -->
      <div
        v-else
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Code
                </th>
                <th
                  class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Parent
                </th>
                <th
                  v-if="currentLevel === 'polling_station'"
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Registered Voters
                </th>
                <th
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="item in paginatedData"
                :key="item.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td
                  class="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                >
                  {{ item.code }}
                </td>
                <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <button
                    v-if="item.type !== 'polling_station'"
                    @click="drillDown(item)"
                    class="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {{ item.name }}
                  </button>
                  <span v-else class="text-sm text-gray-900">
                    {{ item.name }}
                  </span>
                </td>
                <td
                  class="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap"
                >
                  <Badge :variant="getTypeColor(item.type)">
                    {{ formatType(item.type) }}
                  </Badge>
                </td>
                <td
                  class="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {{ item.parent || '-' }}
                </td>
                <td
                  v-if="currentLevel === 'polling_station'"
                  class="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {{ item.registeredVoters?.toLocaleString() || '-' }}
                </td>
                <td
                  class="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap"
                >
                  <Badge :variant="item.isActive ? 'success' : 'danger'">
                    {{ item.isActive ? 'Active' : 'Inactive' }}
                  </Badge>
                </td>
                <td
                  class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <Dropdown>
                    <DropdownItem @click="viewDetails(item)">
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Details
                    </DropdownItem>
                    <DropdownItem @click="editItem(item)">
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      v-if="item.type !== 'polling_station'"
                      @click="drillDown(item)"
                    >
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      View Children
                    </DropdownItem>
                    <DropdownItem variant="danger" @click="confirmDelete(item)">
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </DropdownItem>
                  </Dropdown>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div
            class="flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ startIndex + 1 }}</span>
              to
              <span class="font-medium">{{
                Math.min(endIndex, filteredData.length)
              }}</span>
              of
              <span class="font-medium">{{ filteredData.length }}</span>
              results
            </div>
            <div class="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                @click="previousPage"
                :disabled="currentPage === 1"
              >
                Previous
              </Button>
              <span class="text-sm text-gray-700">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <Button
                variant="secondary"
                size="sm"
                @click="nextPage"
                :disabled="currentPage === totalPages"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import Button from '@/components/common/Button.vue';
import SearchBar from '@/components/common/SearchBar.vue';
import Select from '@/components/common/Select.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import DropdownItem from '@/components/common/DropdownItem.vue';
import Badge from '@/components/common/Badge.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Alert from '@/components/common/Alert.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import StatCard from '@/components/admin/StatCard.vue';

// Types
interface VotingArea {
  id: string;
  code: string;
  name: string;
  type: 'county' | 'constituency' | 'ward' | 'polling_station';
  parent?: string;
  parentId?: string;
  registeredVoters?: number;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
}

interface Breadcrumb {
  label: string;
  type: string;
  id?: string;
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const selectedLevel = ref('all');
const selectedCounty = ref('');
const currentLevel = ref('county');
const showAddModal = ref(false);
const breadcrumbs = ref<Breadcrumb[]>([]);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Mock data (replace with API calls later)
const allData = ref<VotingArea[]>([]);

// Stats
const stats = computed(() => ({
  counties: allData.value.filter((d) => d.type === 'county').length,
  constituencies: allData.value.filter((d) => d.type === 'constituency').length,
  wards: allData.value.filter((d) => d.type === 'ward').length,
  pollingStations: allData.value.filter((d) => d.type === 'polling_station')
    .length,
}));

// Options
const levelOptions = computed(() => [
  { value: 'all', label: 'All Levels' },
  { value: 'county', label: 'Counties' },
  { value: 'constituency', label: 'Constituencies' },
  { value: 'ward', label: 'Wards' },
  { value: 'polling_station', label: 'Polling Stations' },
]);

const countyOptions = computed(() => [
  { value: '', label: 'All Counties' },
  ...allData.value
    .filter((d) => d.type === 'county')
    .map((d) => ({ value: d.id, label: d.name })),
]);

// Filtered and paginated data
const filteredData = computed(() => {
  let data = allData.value;

  // Filter by level
  if (selectedLevel.value !== 'all') {
    data = data.filter((d) => d.type === selectedLevel.value);
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    data = data.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.code.toLowerCase().includes(query)
    );
  }

  // Filter by county
  if (selectedCounty.value) {
    data = data.filter(
      (d) =>
        d.parentId === selectedCounty.value || d.id === selectedCounty.value
    );
  }

  return data;
});

const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / itemsPerPage.value)
);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => startIndex.value + itemsPerPage.value);

const paginatedData = computed(() =>
  filteredData.value.slice(startIndex.value, endIndex.value)
);

// Methods
function handleSearch() {
  currentPage.value = 1;
}

function handleLevelChange() {
  currentPage.value = 1;
  currentLevel.value =
    selectedLevel.value === 'all' ? 'county' : selectedLevel.value;
}

function handleCountyChange() {
  currentPage.value = 1;
}

function drillDown(item: VotingArea) {
  breadcrumbs.value.push({
    label: item.name,
    type: item.type,
    id: item.id,
  });
  selectedCounty.value = item.id;

  // Update level based on item type
  if (item.type === 'county') {
    selectedLevel.value = 'constituency';
  } else if (item.type === 'constituency') {
    selectedLevel.value = 'ward';
  } else if (item.type === 'ward') {
    selectedLevel.value = 'polling_station';
  }
}

function navigateTo(crumb: Breadcrumb) {
  const index = breadcrumbs.value.findIndex((b) => b.id === crumb.id);
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
  if (crumb.id) {
    selectedCounty.value = crumb.id;
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function viewDetails(item: VotingArea) {
  console.log('View details:', item);
  // TODO: Implement details modal
}

function editItem(item: VotingArea) {
  console.log('Edit item:', item);
  // TODO: Implement edit functionality
}

function confirmDelete(item: VotingArea) {
  console.log('Delete item:', item);
  // TODO: Implement delete confirmation
}

function formatType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    county: 'primary',
    constituency: 'success',
    ward: 'warning',
    polling_station: 'info',
  };
  return colors[type] || 'secondary';
}

// Lifecycle
onMounted(async () => {
  loading.value = true;
  try {
    // TODO: Implement API call when backend endpoint is ready
    // Example:
    // const response = await api.get('/api/v1/geographic/all');
    // allData.value = response.data.data;

    // For now, initialize with empty array
    allData.value = [];
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load voting areas';
  } finally {
    loading.value = false;
  }
});
</script>
