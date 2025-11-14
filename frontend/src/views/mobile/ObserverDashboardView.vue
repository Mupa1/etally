<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Header -->
    <MobileHeader
      title="Agents Portal"
      :subtitle="userName"
      @logout="handleLogout"
    />

    <!-- Content -->
    <div class="p-4">
      <!-- Quick Stats -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Assigned Stations</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ assignedStations }}
          </p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-sm text-gray-600">Results Submitted</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ resultsSubmitted }}
          </p>
        </div>
      </div>

      <!-- Preferred Polling Station -->
      <FormCard title="Preferred Polling Station" class="mb-4">
        <div v-if="loadingProfile" class="text-sm text-gray-600">
          Loading your preference...
        </div>
        <div v-else>
          <Alert
            v-if="profileError"
            variant="danger"
            :message="profileError"
            class="mb-4"
          />
          <div v-else>
            <div v-if="hasPreferredLocation" class="space-y-2">
              <p class="text-sm text-gray-700">
                <span class="font-semibold">County:</span>
                {{ profile?.preferredCounty?.name || 'Not set' }}
              </p>
              <p class="text-sm text-gray-700">
                <span class="font-semibold">Constituency:</span>
                {{ profile?.preferredConstituency?.name || 'Not set' }}
              </p>
              <p class="text-sm text-gray-700">
                <span class="font-semibold">Ward:</span>
                {{ profile?.preferredWard?.name || 'Not set' }}
              </p>
              <p class="text-sm text-gray-700">
                <span class="font-semibold">Polling Station:</span>
                {{ profile?.preferredStation?.name || 'Not set' }}
              </p>
            </div>
            <div v-else class="text-sm text-gray-700">
              You have not selected a preferred polling station yet.
            </div>
            <Button
              variant="primary"
              size="sm"
              class="mt-4"
              @click="openPreferenceModal"
            >
              Update Preference
            </Button>
          </div>
        </div>
      </FormCard>

      <!-- No Assignments Notice -->
      <template v-if="assignmentsLoading">
        <Alert variant="info" class="p-6">
          <p class="text-sm text-gray-700">Loading your assignments...</p>
        </Alert>
      </template>
      <template v-else-if="assignmentsError">
        <Alert variant="danger" class="p-6" :message="assignmentsError" />
      </template>
      <template v-else-if="assignments.length === 0">
        <Alert variant="info" title="No elections assigned yet" class="p-6">
          <p class="text-sm text-gray-700">
            There are currently no elections assigned to you. Once an assignment
            is available, it will appear here with the stations and actions you
            need to take.
          </p>
        </Alert>
      </template>
      <template v-else>
        <FormCard title="Assigned Elections" class="space-y-4">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="rounded-lg border border-gray-200 p-4"
          >
            <p class="text-sm text-gray-600">
              <span class="font-semibold">Polling Station:</span>
              {{ assignment.pollingStation?.name || 'Unknown station' }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-semibold">Ward:</span>
              {{ assignment.pollingStation?.ward?.name || 'Unknown ward' }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-semibold">Constituency:</span>
              {{
                assignment.pollingStation?.ward?.constituency?.name ||
                'Unknown constituency'
              }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-semibold">County:</span>
              {{
                assignment.pollingStation?.ward?.constituency?.county?.name ||
                'Unknown county'
              }}
            </p>
            <p class="text-xs text-gray-500 mt-2">
              Assigned on
              {{
                assignment.assignmentDate
                  ? formatDate(assignment.assignmentDate)
                  : 'Unknown date'
              }}
            </p>
          </div>
        </FormCard>
      </template>
    </div>

    <!-- Preference Modal -->
    <Modal
      v-model="showPreferenceModal"
      title="Update Preferred Polling Station"
      size="lg"
    >
      <p class="text-sm text-gray-600 mb-4">
        Select your preferred location so we can match you with the closest
        polling station when assignments open.
      </p>
      <GeographicCascadeSelector
        v-model:countyId="locationForm.countyId"
        v-model:constituencyId="locationForm.constituencyId"
        v-model:wardId="locationForm.wardId"
        v-model:stationId="locationForm.stationId"
        :show-polling-stations="true"
        show-help-text
      />

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="closePreferenceModal">
            Cancel
          </Button>
          <Button
            variant="primary"
            :loading="savingPreference"
            @click="savePreference"
          >
            Save Preference
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import { handleError } from '@/utils/errorHandler';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import Alert from '@/components/common/Alert.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import MobileHeader from '@/components/mobile/MobileHeader.vue';
import FormCard from '@/components/mobile/FormCard.vue';
import GeographicCascadeSelector from '@/components/mobile/GeographicCascadeSelector.vue';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const assignedStations = ref(0);
const resultsSubmitted = ref(0);
const assignments = ref<any[]>([]);
const assignmentsLoading = ref(false);
const assignmentsError = ref('');
const profile = ref<any>(null);
const loadingProfile = ref(false);
const profileError = ref('');
const showPreferenceModal = ref(false);
const savingPreference = ref(false);
const locationForm = ref({
  countyId: '',
  constituencyId: '',
  wardId: '',
  stationId: '',
});

const userName = computed(() => {
  const user = authStore.user;
  return user ? `${user.firstName} ${user.lastName}` : 'Observer';
});

const hasPreferredLocation = computed(() => {
  if (!profile.value) return false;
  return Boolean(
    profile.value.preferredStation ||
      profile.value.preferredWard ||
      profile.value.preferredConstituency ||
      profile.value.preferredCounty
  );
});

onMounted(() => {
  // TODO: Load observer data in Phase 2
  assignedStations.value = 0;
  resultsSubmitted.value = 0;
  loadProfile();
  loadAssignments();
});

async function loadProfile() {
  loadingProfile.value = true;
  profileError.value = '';

  try {
    const response = await api.get('/observers/mobile/profile');
    profile.value = response.data;
  } catch (err: any) {
    handleError(err, {
      component: 'ObserverDashboardView',
      action: 'load_profile',
    });
    profileError.value =
      err.response?.data?.message || 'Failed to load your profile';
  } finally {
    loadingProfile.value = false;
  }
}

async function loadAssignments() {
  assignmentsLoading.value = true;
  assignmentsError.value = '';

  try {
    const response = await api.get('/observers/mobile/assignments');
    assignments.value = response.data || [];
  } catch (err: any) {
    handleError(err, {
      component: 'ObserverDashboardView',
      action: 'load_assignments',
    });
    assignmentsError.value =
      err.response?.data?.message || 'Failed to load assignments';
  } finally {
    assignmentsLoading.value = false;
  }
}

function openPreferenceModal() {
  if (profile.value) {
    locationForm.value = {
      countyId: profile.value.preferredCounty?.id || '',
      constituencyId: profile.value.preferredConstituency?.id || '',
      wardId: profile.value.preferredWard?.id || '',
      stationId: profile.value.preferredStation?.id || '',
    };
  }
  showPreferenceModal.value = true;
}

function closePreferenceModal() {
  showPreferenceModal.value = false;
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function savePreference() {
  savingPreference.value = true;
  profileError.value = '';

  try {
    await api.put('/observers/mobile/profile', {
      preferredCountyId: locationForm.value.countyId || undefined,
      preferredConstituencyId: locationForm.value.constituencyId || undefined,
      preferredWardId: locationForm.value.wardId || undefined,
      preferredStationId: locationForm.value.stationId || undefined,
    });

    toast.success('Preferred polling station updated');
    showPreferenceModal.value = false;
    await loadProfile();
  } catch (err: any) {
    handleError(err, {
      component: 'ObserverDashboardView',
      action: 'update_preference',
    });
    toast.error(
      err.response?.data?.message || 'Failed to update preferred station'
    );
  } finally {
    savingPreference.value = false;
  }
}

function handleLogout() {
  authStore.logout();
  router.push('/agent/login');
}
</script>
