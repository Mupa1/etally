<template>
  <Modal
    v-model="isOpen"
    title="Manage Coalitions"
    size="xl"
    @close="handleClose"
  >
    <!-- Tabs: Coalitions List | Create Coalition -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          @click="activeTab = 'list'"
          :class="[
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'list'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          Coalitions
        </button>
        <button
          @click="activeTab = 'create'"
          :class="[
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'create'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          Create Coalition
        </button>
      </nav>
    </div>

    <!-- Coalitions List Tab -->
    <div v-if="activeTab === 'list'">
      <div v-if="loading" class="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>

      <Alert v-else-if="error" variant="danger" :message="error" />

      <div v-else-if="coalitions.length === 0" class="text-center py-8">
        <p class="text-gray-500">No coalitions found. Create one to get started.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="coalition in coalitions"
          :key="coalition.id"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ coalition.name }}
                </h3>
                <Badge
                  :variant="coalition.isCompetitor ? 'warning' : 'success'"
                >
                  {{ coalition.isCompetitor ? 'Competitor' : 'Friendly' }}
                </Badge>
                <Badge
                  :variant="coalition.isActive ? 'success' : 'secondary'"
                >
                  {{ coalition.isActive ? 'Active' : 'Inactive' }}
                </Badge>
              </div>
              <p v-if="coalition.abbreviation" class="text-sm text-gray-600 mb-1">
                {{ coalition.abbreviation }}
              </p>
              <p v-if="coalition.description" class="text-sm text-gray-500 mb-3">
                {{ coalition.description }}
              </p>

              <!-- Parties in Coalition -->
              <div v-if="coalition.parties && coalition.parties.length > 0" class="mt-3">
                <p class="text-sm font-medium text-gray-700 mb-2">
                  Parties ({{ coalition.parties.length }}):
                </p>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="partyMember in coalition.parties"
                    :key="partyMember.party.id"
                    variant="secondary"
                  >
                    {{ partyMember.party.abbreviation || partyMember.party.partyName }}
                  </Badge>
                </div>
              </div>
              <p v-else class="text-sm text-gray-500 mt-2">
                No parties in this coalition
              </p>
            </div>

            <div class="flex gap-2 ml-4">
              <Button
                variant="primary"
                size="sm"
                @click="manageParties(coalition)"
              >
                Manage Parties
              </Button>
              <Button
                variant="secondary"
                size="sm"
                @click="editCoalition(coalition)"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                @click="deleteCoalition(coalition)"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Coalition Tab -->
    <div v-if="activeTab === 'create'">
      <div class="space-y-4">
        <Alert
          v-if="error"
          variant="danger"
          :message="error"
          dismissible
          @dismiss="error = ''"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Coalition Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Kenya Kwanza Coalition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Abbreviation
          </label>
          <input
            v-model="form.abbreviation"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., KK"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Optional description of the coalition"
          ></textarea>
        </div>

        <div class="flex items-center">
          <input
            v-model="form.isCompetitor"
            type="checkbox"
            id="isCompetitor"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="isCompetitor" class="ml-2 block text-sm text-gray-700">
            Mark as competitor coalition
          </label>
        </div>

        <div class="flex items-center">
          <input
            v-model="form.isActive"
            type="checkbox"
            id="isActive"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="isActive" class="ml-2 block text-sm text-gray-700">
            Active
          </label>
        </div>
      </div>
    </div>

    <!-- Footer slot - conditionally show buttons based on active tab -->
    <template #footer>
      <div v-if="activeTab === 'create'" class="flex gap-3">
        <Button variant="secondary" @click="resetForm">Cancel</Button>
        <Button
          variant="primary"
          :loading="submitting"
          @click="handleCreate"
        >
          Create Coalition
        </Button>
      </div>
    </template>

    <!-- Manage Parties Modal -->
    <Modal
      v-model="showManageParties"
      :title="`Manage Parties in ${selectedCoalition?.name || 'Coalition'}`"
      size="lg"
      @close="showManageParties = false"
    >
      <div v-if="selectedCoalition" class="space-y-4">
        <Alert
          v-if="error"
          variant="danger"
          :message="error"
          dismissible
          @dismiss="error = ''"
        />

        <!-- Add Parties Section -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Add Parties to Coalition
          </label>
          <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
            <div v-if="availableParties.length === 0" class="text-sm text-gray-500 text-center py-4">
              No available parties to add
            </div>
            <div v-else class="space-y-2">
              <label
                v-for="party in availableParties"
                :key="party.id"
                class="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  v-model="selectedPartyIds"
                  type="checkbox"
                  :value="party.id"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div class="ml-3 flex-1">
                  <div class="text-sm font-medium text-gray-900">
                    {{ party.partyName }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ party.abbreviation || party.certificateNumber }}
                  </div>
                </div>
                <CoalitionBadge
                  v-if="party.coalitions && party.coalitions.length > 0"
                  :coalitions="party.coalitions"
                  class="ml-2"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- Current Parties Section -->
        <div v-if="selectedCoalition.parties && selectedCoalition.parties.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Current Parties ({{ selectedCoalition.parties.length }})
          </label>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="partyMember in selectedCoalition.parties"
              :key="partyMember.party.id"
              variant="secondary"
              class="flex items-center gap-1"
            >
              {{ partyMember.party.abbreviation || partyMember.party.partyName }}
              <button
                @click="removeParty(partyMember.party.id)"
                class="text-gray-500 hover:text-red-600 ml-1"
                title="Remove from coalition"
              >
                ×
              </button>
            </Badge>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <Button variant="secondary" @click="showManageParties = false">
            Cancel
          </Button>
          <Button
            variant="primary"
            :loading="updatingParties"
            :disabled="selectedPartyIds.length === 0"
            @click="addPartiesToCoalition"
          >
            Add {{ selectedPartyIds.length }} Party(s)
          </Button>
        </div>
      </template>
    </Modal>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Alert from '@/components/common/Alert.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import CoalitionBadge from '@/components/common/CoalitionBadge.vue';
import { useToast } from '@/composables/useToast';
import api from '@/utils/api';

interface Coalition {
  id: string;
  name: string;
  abbreviation?: string;
  description?: string;
  isCompetitor?: boolean;
  isActive?: boolean;
  parties?: Array<{
    id: string;
    party: {
      id: string;
      partyName: string;
      abbreviation?: string;
      logoUrl?: string;
      primaryColor?: string;
      isActive?: boolean;
    };
  }>;
}

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'coalition-created': [];
}>();

const toast = useToast();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const activeTab = ref<'list' | 'create'>('list');
const loading = ref(false);
const submitting = ref(false);
const updatingParties = ref(false);
const error = ref('');
const coalitions = ref<Coalition[]>([]);
const showManageParties = ref(false);
const selectedCoalition = ref<Coalition | null>(null);
const availableParties = ref<any[]>([]);
const selectedPartyIds = ref<string[]>([]);

const form = ref({
  name: '',
  abbreviation: '',
  description: '',
  isCompetitor: false,
  isActive: true,
});

watch(isOpen, (newValue) => {
  if (newValue) {
    loadCoalitions();
  } else {
    resetForm();
  }
});

function resetForm() {
  form.value = {
    name: '',
    abbreviation: '',
    description: '',
    isCompetitor: false,
    isActive: true,
  };
  error.value = '';
  activeTab.value = 'list';
}

async function loadCoalitions() {
  try {
    loading.value = true;
    error.value = '';

    const response = await api.get('/coalitions');
    if (response.data.success) {
      coalitions.value = response.data.data;
    }
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Error loading coalitions';
    console.error('Error loading coalitions:', err);
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  if (!form.value.name.trim()) {
    error.value = 'Coalition name is required';
    return;
  }

  try {
    submitting.value = true;
    error.value = '';

    const response = await api.post('/coalitions', form.value);
    if (response.data.success) {
      toast.success('Coalition created successfully');
      resetForm();
      await loadCoalitions();
      emit('coalition-created');
    }
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Error creating coalition';
    toast.error(error.value);
    console.error('Error creating coalition:', err);
  } finally {
    submitting.value = false;
  }
}

function editCoalition(coalition: Coalition) {
  // TODO: Implement edit functionality
  toast.info('Edit functionality coming soon');
}

async function deleteCoalition(coalition: Coalition) {
  if (!confirm(`Are you sure you want to delete "${coalition.name}"?`)) {
    return;
  }

  try {
    loading.value = true;
    await api.delete(`/coalitions/${coalition.id}`);
    toast.success('Coalition deleted successfully');
    await loadCoalitions();
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Error deleting coalition';
    toast.error(error.value);
    console.error('Error deleting coalition:', err);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  isOpen.value = false;
  showManageParties.value = false;
  selectedCoalition.value = null;
  selectedPartyIds.value = [];
}

async function manageParties(coalition: Coalition) {
  selectedCoalition.value = coalition;
  selectedPartyIds.value = [];
  
  // Load all parties
  try {
    loading.value = true;
    const response = await api.get('/parties');
    if (response.data.success) {
      // Filter out parties already in this coalition
      const existingPartyIds = new Set(
        (coalition.parties || []).map((p: any) => p.party.id)
      );
      availableParties.value = response.data.data.filter(
        (p: any) => !existingPartyIds.has(p.id) && p.isActive
      );
    }
    showManageParties.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error loading parties';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

async function addPartiesToCoalition() {
  if (!selectedCoalition.value || selectedPartyIds.value.length === 0) {
    return;
  }

  try {
    updatingParties.value = true;
    error.value = '';

    const response = await api.post(
      `/coalitions/${selectedCoalition.value.id}/parties`,
      { partyIds: selectedPartyIds.value }
    );

    if (response.data.success) {
      toast.success(response.data.message);
      await loadCoalitions();
      showManageParties.value = false;
      selectedPartyIds.value = [];
      emit('coalition-created');
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error adding parties to coalition';
    toast.error(error.value);
  } finally {
    updatingParties.value = false;
  }
}

async function removeParty(partyId: string) {
  if (!selectedCoalition.value) return;

  if (!confirm('Remove this party from the coalition?')) {
    return;
  }

  try {
    updatingParties.value = true;
    error.value = '';

    // Note: Some HTTP clients/browsers don't support DELETE with body
    // Using POST with _method override or query params as fallback
    // For now, use POST to /coalitions/:id/parties/remove
    await api.post(`/coalitions/${selectedCoalition.value.id}/parties/remove`, {
      partyIds: [partyId],
    });

    toast.success('Party removed from coalition');
    await loadCoalitions();
    // Refresh the selected coalition
    const refreshed = coalitions.value.find((c) => c.id === selectedCoalition.value!.id);
    if (refreshed) {
      selectedCoalition.value = refreshed;
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error removing party from coalition';
    toast.error(error.value);
  } finally {
    updatingParties.value = false;
  }
}
</script>

