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
        <div class="flex flex-col sm:flex-row gap-2">
          <Button variant="secondary" @click="showUploadModal = true">
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload CSV
          </Button>
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
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Counties"
          :value="stats.counties.toLocaleString()"
          icon="map"
          color="primary"
        />
        <StatCard
          title="Constituencies"
          :value="stats.constituencies.toLocaleString()"
          icon="building"
          color="success"
        />
        <StatCard
          title="Wards"
          :value="stats.wards.toLocaleString()"
          icon="location"
          color="warning"
        />
        <StatCard
          title="Polling Stations"
          :value="stats.pollingStations.toLocaleString()"
          icon="check-circle"
          color="primary"
        />
        <StatCard
          title="Registered Voters"
          :value="stats.totalRegisteredVoters.toLocaleString()"
          icon="users"
          color="success"
        />
      </div>

      <!-- Search and Filters -->
      <div class="bg-white shadow-sm rounded-lg p-4 mb-6">
        <!-- Mobile: Stack all filters vertically -->
        <div class="space-y-4 md:space-y-0">
          <!-- Search - Full width on mobile, half on desktop -->
          <div class="w-full">
            <SearchBar
              v-model="searchQuery"
              placeholder="Search by name or code..."
            />
          </div>

          <!-- Filters Grid - Stack on mobile, grid on desktop -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <!-- Level Filter -->
            <Select
              v-model="selectedLevel"
              label="Level"
              placeholder="All Levels"
              :options="levelOptions"
              @update:modelValue="handleLevelChange"
            />

            <!-- County Filter -->
            <Select
              v-model="selectedCounty"
              label="County"
              placeholder="All Counties"
              :options="countyOptions"
              @update:modelValue="handleCountyChange"
              :disabled="!selectedLevel || selectedLevel === 'all'"
            />
          </div>

          <!-- Actions - Full width on mobile, right-aligned on desktop -->
          <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              @click="resetFilters"
              class="w-full sm:w-auto"
            >
              Reset Filters
            </Button>
            <Button
              variant="primary"
              @click="handleSearch"
              class="w-full sm:w-auto"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        <!-- Breadcrumb Navigation -->
        <div
          v-if="breadcrumbs.length > 0"
          class="flex items-center space-x-2 text-sm mt-4 pt-4 border-t border-gray-200"
        >
          <button
            @click="goHome"
            class="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Home</span>
          </button>
          <svg
            class="w-4 h-4 text-gray-400"
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
          <button
            v-for="(crumb, index) in breadcrumbs"
            :key="index"
            @click="navigateTo(crumb)"
            class="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
          >
            <span>{{ crumb.label }}</span>
            <svg
              v-if="index < breadcrumbs.length - 1"
              class="w-4 h-4 text-gray-400"
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
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error State -->
      <Alert v-else-if="error" type="error" :message="error" class="mb-4" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="filteredData.length === 0"
        title="No voting areas found"
        description="Try adjusting your search or filters"
        icon="folder"
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
                  v-if="currentLevel === 'county'"
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Constituencies
                </th>
                <th
                  v-if="
                    currentLevel === 'county' || currentLevel === 'constituency'
                  "
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Wards
                </th>
                <th
                  v-if="currentLevel !== 'polling_station'"
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Polling Stations
                </th>
                <th
                  class="hidden md:table-cell px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Registered Voters
                </th>
                <th
                  v-if="currentLevel === 'polling_station'"
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
                  v-if="currentLevel === 'county'"
                  class="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right"
                >
                  {{ item.totalConstituencies?.toLocaleString() || '-' }}
                </td>
                <td
                  v-if="
                    currentLevel === 'county' || currentLevel === 'constituency'
                  "
                  class="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right"
                >
                  {{ item.totalWards?.toLocaleString() || '-' }}
                </td>
                <td
                  v-if="currentLevel !== 'polling_station'"
                  class="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right"
                >
                  {{ item.totalPollingStations?.toLocaleString() || '-' }}
                </td>
                <td
                  class="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right"
                >
                  {{
                    (
                      item.registeredVoters ||
                      item.totalRegisteredVoters ||
                      0
                    ).toLocaleString()
                  }}
                </td>
                <td
                  v-if="currentLevel === 'polling_station'"
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
                Math.min(startIndex + hierarchyItems.length, totalCount)
              }}</span>
              of
              <span class="font-medium">{{ totalCount.toLocaleString() }}</span>
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
                :disabled="currentPage >= totalPages"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <VotingAreasUploadModal
      v-model="showUploadModal"
      @upload-complete="handleUploadComplete"
    />
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
import VotingAreasUploadModal from '@/components/admin/VotingAreasUploadModal.vue';
import api from '@/utils/api';

// Types
interface VotingArea {
  id: string;
  code: string;
  name: string;
  type: 'county' | 'constituency' | 'ward' | 'polling_station';
  parent?: string;
  parentId?: string;
  registeredVoters?: number;
  totalRegisteredVoters?: number;
  totalConstituencies?: number;
  totalWards?: number;
  totalPollingStations?: number;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
}

interface PollingStation {
  id: string;
  code: string;
  name: string;
  registeredVoters: number;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  ward: {
    id: string;
    code: string;
    name: string;
  };
  constituency: {
    id: string;
    code: string;
    name: string;
  };
  county: {
    id: string;
    code: string;
    name: string;
  };
}

interface HierarchyItem {
  id: string;
  code: string;
  name: string;
  type: 'county' | 'constituency' | 'ward' | 'polling_station';

  // Statistics
  totalConstituencies?: number;
  totalWards?: number;
  totalPollingStations?: number;
  totalRegisteredVoters: number;
  registeredVoters?: number;

  // Parent info
  countyId?: string;
  countyName?: string;
  constituencyId?: string;
  constituencyName?: string;
  wardId?: string;
  wardName?: string;

  isActive?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface Breadcrumb {
  label: string;
  type: string;
  id?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const selectedLevel = ref('all');
const selectedCounty = ref('');
const currentLevel = ref('county');
const showAddModal = ref(false);
const showUploadModal = ref(false);
const breadcrumbs = ref<Breadcrumb[]>([]);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(20);
const totalPages = ref(1);
const totalCount = ref(0);

// Hierarchy data
const hierarchyItems = ref<HierarchyItem[]>([]);

// Stats state
const stats = ref({
  counties: 0,
  constituencies: 0,
  wards: 0,
  pollingStations: 0,
  totalRegisteredVoters: 0,
});

// County data for dropdown
const counties = ref<Array<{ id: string; code: string; name: string }>>([]);

// Function to load voting area statistics
async function loadVotingAreaStatistics() {
  try {
    console.log('Fetching voting area statistics...');
    const response = await api.get('/geographic/voting-stats', {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    console.log('Statistics response:', response.data);

    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('Updating stats with data:', data);

      stats.value = {
        counties: data.totalCounties || 0,
        constituencies: data.totalConstituencies || 0,
        wards: data.totalWards || 0,
        pollingStations: data.totalPollingStations || 0,
        totalRegisteredVoters: data.totalRegisteredVoters || 0,
      };

      // Extract counties for dropdown
      if (data.counties && Array.isArray(data.counties)) {
        counties.value = data.counties.map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
        }));
      }

      console.log('Stats updated:', stats.value);
    } else {
      console.warn('No data in response or success is false');
    }
  } catch (err: any) {
    console.error('Failed to load voting area statistics:', err);
    console.error('Error details:', err.response?.data);
    // Keep default values on error
  }
}

// Function to load hierarchy data based on current context
async function loadHierarchyData() {
  loading.value = true;
  error.value = null;

  try {
    // Determine the current level based on breadcrumbs and selections
    let level: 'county' | 'constituency' | 'ward' | 'polling_station' =
      'county';

    if (selectedLevel.value !== 'all') {
      level = selectedLevel.value as any;
    } else {
      // Auto-determine level based on breadcrumbs
      if (breadcrumbs.value.length === 0) {
        level = 'county';
      } else {
        const lastBreadcrumb = breadcrumbs.value[breadcrumbs.value.length - 1];
        if (lastBreadcrumb.type === 'county') level = 'constituency';
        else if (lastBreadcrumb.type === 'constituency') level = 'ward';
        else if (lastBreadcrumb.type === 'ward') level = 'polling_station';
      }
    }

    console.log('Fetching hierarchy data:', {
      level,
      search: searchQuery.value,
      breadcrumbs: breadcrumbs.value,
      page: currentPage.value,
      limit: itemsPerPage.value,
    });

    const params: any = {
      level,
      page: currentPage.value,
      limit: itemsPerPage.value,
    };

    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    // Add appropriate ID based on current breadcrumb context
    if (breadcrumbs.value.length > 0) {
      const lastBreadcrumb = breadcrumbs.value[breadcrumbs.value.length - 1];
      if (lastBreadcrumb.type === 'county') {
        params.countyId = lastBreadcrumb.id;
      } else if (lastBreadcrumb.type === 'constituency') {
        params.constituencyId = lastBreadcrumb.id;
      } else if (lastBreadcrumb.type === 'ward') {
        params.wardId = lastBreadcrumb.id;
      }
    }

    // Override with manual county filter if set
    if (selectedCounty.value && breadcrumbs.value.length === 0) {
      params.countyId = selectedCounty.value;
      level = 'constituency'; // Show constituencies when a county is selected
    }

    const response = await api.get('/geographic/hierarchy', { params });
    console.log('Hierarchy response:', response.data);

    if (response.data.success) {
      hierarchyItems.value = response.data.data || [];
      currentLevel.value = level;

      if (response.data.pagination) {
        totalPages.value = response.data.pagination.totalPages;
        totalCount.value = response.data.pagination.totalCount;
      }

      console.log(`Loaded ${hierarchyItems.value.length} ${level} items`);
    }
  } catch (err: any) {
    console.error('Failed to load hierarchy data:', err);
    error.value = err.response?.data?.message || 'Failed to load voting areas';
    hierarchyItems.value = [];
  } finally {
    loading.value = false;
  }
}

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
  ...counties.value.map((c) => ({ value: c.id, label: c.name })),
]);

// Transform hierarchy items to VotingArea format for display
const filteredData = computed(() => {
  return hierarchyItems.value.map((item) => {
    let parent = '';

    if (item.type === 'constituency') {
      parent = item.countyName || '';
    } else if (item.type === 'ward') {
      parent = `${item.constituencyName} (${item.countyName})`;
    } else if (item.type === 'polling_station') {
      parent = `${item.wardName} (${item.constituencyName}, ${item.countyName})`;
    }

    return {
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      parent: parent || undefined,
      parentId: item.wardId || item.constituencyId || item.countyId,
      registeredVoters: item.registeredVoters,
      totalRegisteredVoters: item.totalRegisteredVoters,
      totalConstituencies: item.totalConstituencies,
      totalWards: item.totalWards,
      totalPollingStations: item.totalPollingStations,
      isActive: item.isActive !== undefined ? item.isActive : true,
      latitude: item.latitude || undefined,
      longitude: item.longitude || undefined,
    };
  });
});

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => currentPage.value * itemsPerPage.value);

// Since we're using server-side pagination, paginatedData is just the current data
const paginatedData = computed(() => filteredData.value);

// Methods
async function handleSearch() {
  currentPage.value = 1;
  await loadHierarchyData();
}

async function handleLevelChange() {
  currentPage.value = 1;
  currentLevel.value =
    selectedLevel.value === 'all' ? 'county' : selectedLevel.value;
  await loadHierarchyData();
}

async function handleCountyChange() {
  currentPage.value = 1;
  await loadHierarchyData();
}

async function resetFilters() {
  searchQuery.value = '';
  selectedLevel.value = 'all';
  selectedCounty.value = '';
  breadcrumbs.value = [];
  currentPage.value = 1;
  await loadHierarchyData();
}

async function drillDown(item: VotingArea) {
  breadcrumbs.value.push({
    label: item.name,
    type: item.type,
    id: item.id,
  });

  // Clear manual filters when drilling down
  selectedCounty.value = '';
  selectedLevel.value = 'all';
  currentPage.value = 1;

  // Reload data to show children of this item
  await loadHierarchyData();
}

async function goHome() {
  breadcrumbs.value = [];
  selectedCounty.value = '';
  selectedLevel.value = 'all';
  currentPage.value = 1;
  await loadHierarchyData();
}

async function navigateTo(crumb: Breadcrumb) {
  const index = breadcrumbs.value.findIndex((b) => b.id === crumb.id);
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);

  selectedCounty.value = '';
  selectedLevel.value = 'all';
  currentPage.value = 1;

  await loadHierarchyData();
}

async function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    await loadHierarchyData();
  }
}

async function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    await loadHierarchyData();
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

function getTypeColor(
  type: string
):
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'gray' {
  const colors: Record<
    string,
    'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray'
  > = {
    county: 'primary',
    constituency: 'success',
    ward: 'warning',
    polling_station: 'info',
  };
  return colors[type] || 'secondary';
}

async function handleUploadComplete(summary: any) {
  // Refresh the data after successful upload
  console.log('Upload completed with summary:', summary);

  // Reload statistics to reflect the new data
  await loadVotingAreaStatistics();

  // Reload hierarchy data
  await loadHierarchyData();
}

// Lifecycle
onMounted(async () => {
  console.log('=== VotingAreasView mounted ===');
  try {
    // Load voting area statistics
    console.log('Calling loadVotingAreaStatistics...');
    await loadVotingAreaStatistics();
    console.log('loadVotingAreaStatistics completed');

    // Load hierarchy data (starts at county level)
    console.log('Calling loadHierarchyData...');
    await loadHierarchyData();
    console.log('loadHierarchyData completed');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load voting areas';
  }
});
</script>
