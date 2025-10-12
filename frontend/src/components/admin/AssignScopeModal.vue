<template>
  <Modal v-model="isOpen" title="Assign Geographic Scope" size="md">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Scope Level -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Scope Level <span class="text-red-500">*</span>
        </label>
        <select v-model="form.scopeLevel" required class="form-input">
          <option value="">Select scope level</option>
          <option value="national">National (Full Access)</option>
          <option value="county">County</option>
          <option value="constituency">Constituency</option>
          <option value="ward">Ward</option>
        </select>
      </div>

      <!-- County Selection -->
      <div v-if="['county', 'constituency', 'ward'].includes(form.scopeLevel)">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          County <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.countyId"
          type="text"
          required
          class="form-input"
          placeholder="County UUID (from database)"
        />
        <p class="mt-1 text-xs text-gray-500">
          Enter the county UUID from the database
        </p>
      </div>

      <!-- Constituency Selection -->
      <div v-if="['constituency', 'ward'].includes(form.scopeLevel)">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Constituency <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.constituencyId"
          type="text"
          required
          class="form-input"
          placeholder="Constituency UUID"
        />
      </div>

      <!-- Ward Selection -->
      <div v-if="form.scopeLevel === 'ward'">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Ward <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.wardId"
          type="text"
          required
          class="form-input"
          placeholder="Ward UUID"
        />
      </div>

      <!-- Help Text -->
      <Alert type="info">
        <div class="text-sm">
          <strong>Scope Levels:</strong>
          <ul class="mt-2 space-y-1 list-disc list-inside">
            <li><strong>National:</strong> Access to all regions</li>
            <li><strong>County:</strong> Access to specific county</li>
            <li>
              <strong>Constituency:</strong> Access to specific constituency
            </li>
            <li><strong>Ward:</strong> Access to specific ward</li>
          </ul>
        </div>
      </Alert>

      <!-- Error Message -->
      <Alert v-if="error" type="error" :message="error" />
    </form>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="isOpen = false">Cancel</Button>
        <Button variant="primary" :loading="saving" @click="handleSubmit">
          Assign Scope
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import api from '@/utils/api';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Alert from '@/components/common/Alert.vue';

interface Props {
  modelValue: boolean;
  userId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'assigned'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  scopeLevel: '',
  countyId: '',
  constituencyId: '',
  wardId: '',
});

const saving = ref(false);
const error = ref('');

// Reset form when modal closes
watch(isOpen, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});

function resetForm() {
  form.value = {
    scopeLevel: '',
    countyId: '',
    constituencyId: '',
    wardId: '',
  };
  error.value = '';
}

async function handleSubmit() {
  error.value = '';
  saving.value = true;

  try {
    const data: any = {
      scopeLevel: form.value.scopeLevel,
    };

    // Add geographic IDs based on scope level
    if (form.value.scopeLevel === 'county') {
      data.countyId = form.value.countyId;
    } else if (form.value.scopeLevel === 'constituency') {
      data.countyId = form.value.countyId;
      data.constituencyId = form.value.constituencyId;
    } else if (form.value.scopeLevel === 'ward') {
      data.countyId = form.value.countyId;
      data.constituencyId = form.value.constituencyId;
      data.wardId = form.value.wardId;
    }

    await api.post(`/users/${props.userId}/scopes`, data);
    emit('assigned');
    resetForm();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to assign scope';
  } finally {
    saving.value = false;
  }
}
</script>
