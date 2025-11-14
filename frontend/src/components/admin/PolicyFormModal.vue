<template>
  <Modal
    v-model="isOpen"
    :title="isEditMode ? 'Edit Policy' : 'Create Policy'"
    size="lg"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Policy Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Policy Name <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          required
          class="form-input"
          placeholder="e.g., Election Day Hours Restriction"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          v-model="form.description"
          rows="2"
          class="form-input"
          placeholder="Explain what this policy does"
        />
      </div>

      <!-- Effect -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Effect <span class="text-red-500">*</span>
        </label>
        <select v-model="form.effect" required class="form-input">
          <option value="allow">Allow</option>
          <option value="deny">Deny</option>
        </select>
        <p class="mt-1 text-xs text-gray-500">
          Allow policies grant access. Deny policies block access.
        </p>
      </div>

      <!-- Priority -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Priority <span class="text-red-500">*</span>
        </label>
        <input
          v-model.number="form.priority"
          type="number"
          min="0"
          max="100"
          required
          class="form-input"
        />
        <p class="mt-1 text-xs text-gray-500">
          Higher priority policies are evaluated first (0-100)
        </p>
      </div>

      <!-- Resource Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Resource Type <span class="text-red-500">*</span>
        </label>
        <select v-model="form.resourceType" required class="form-input">
          <option value="">Select resource type</option>
          <option value="election">Elections</option>
          <option value="election_contest">Election Contests</option>
          <option value="candidate">Candidates</option>
          <option value="election_result">Election Results</option>
          <option value="incident">Incidents</option>
          <option value="user">Users</option>
          <option value="audit_log">Audit Logs</option>
          <option value="polling_station">Polling Stations</option>
        </select>
      </div>

      <!-- Roles -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Applies to Roles <span class="text-red-500">*</span>
        </label>
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              v-model="form.roles"
              type="checkbox"
              value="super_admin"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Super Admin</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.roles"
              type="checkbox"
              value="election_manager"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Election Manager</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.roles"
              type="checkbox"
              value="field_observer"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Field Agent</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.roles"
              type="checkbox"
              value="public_viewer"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Public Viewer</span>
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Actions <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex items-center">
            <input
              v-model="form.actions"
              type="checkbox"
              value="create"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Create</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.actions"
              type="checkbox"
              value="read"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Read</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.actions"
              type="checkbox"
              value="update"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Update</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.actions"
              type="checkbox"
              value="delete"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Delete</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.actions"
              type="checkbox"
              value="approve"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Approve</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.actions"
              type="checkbox"
              value="verify"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Verify</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.actions"
              type="checkbox"
              value="export"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Export</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.actions"
              type="checkbox"
              value="submit"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Submit</span>
          </label>
        </div>
      </div>

      <!-- Conditions (JSON) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Conditions (JSON)
        </label>
        <textarea
          v-model="conditionsJson"
          rows="4"
          class="form-input font-mono text-sm"
          placeholder='{"timeRange": {"start": "...", "end": "..."}}'
        />
        <p class="mt-1 text-xs text-gray-500">
          Optional JSON conditions for dynamic policy evaluation
        </p>
        <p v-if="conditionsError" class="mt-1 text-xs text-red-600">
          {{ conditionsError }}
        </p>
      </div>

      <!-- Is Active -->
      <div class="flex items-center">
        <input
          v-model="form.isActive"
          type="checkbox"
          id="isActive"
          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label for="isActive" class="ml-2 text-sm text-gray-700">
          Enable policy immediately
        </label>
      </div>
    </form>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="isOpen = false"> Cancel </Button>
        <Button variant="primary" :loading="saving" @click="handleSubmit">
          {{ isEditMode ? 'Update' : 'Create' }} Policy
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

interface Props {
  modelValue: boolean;
  policy?: any | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  description: '',
  effect: 'allow' as 'allow' | 'deny',
  priority: 10,
  roles: [] as string[],
  resourceType: '',
  actions: [] as string[],
  conditions: null as any,
  isActive: true,
});

const conditionsJson = ref('');
const conditionsError = ref('');
const saving = ref(false);

const isEditMode = computed(() => !!props.policy);

// Watch for policy prop changes
watch(
  () => props.policy,
  (newPolicy) => {
    if (newPolicy) {
      form.value = {
        name: newPolicy.name,
        description: newPolicy.description || '',
        effect: newPolicy.effect,
        priority: newPolicy.priority,
        roles: [...newPolicy.roles],
        resourceType: newPolicy.resourceType,
        actions: [...newPolicy.actions],
        conditions: newPolicy.conditions,
        isActive: newPolicy.isActive,
      };
      conditionsJson.value = newPolicy.conditions
        ? JSON.stringify(newPolicy.conditions, null, 2)
        : '';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  form.value = {
    name: '',
    description: '',
    effect: 'allow',
    priority: 10,
    roles: [],
    resourceType: '',
    actions: [],
    conditions: null,
    isActive: true,
  };
  conditionsJson.value = '';
  conditionsError.value = '';
}

async function handleSubmit() {
  conditionsError.value = '';

  // Validate conditions JSON
  if (conditionsJson.value.trim()) {
    try {
      form.value.conditions = JSON.parse(conditionsJson.value);
    } catch (err) {
      conditionsError.value = 'Invalid JSON format';
      return;
    }
  } else {
    form.value.conditions = null;
  }

  saving.value = true;

  try {
    if (isEditMode.value) {
      await api.put(`/policies/${props.policy.id}`, form.value);
    } else {
      await api.post('/policies', form.value);
    }

    emit('saved');
    resetForm();
  } catch (err: any) {
    conditionsError.value =
      err.response?.data?.message || 'Failed to save policy';
  } finally {
    saving.value = false;
  }
}
</script>
