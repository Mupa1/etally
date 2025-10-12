<template>
  <Modal v-model="isOpen" title="Grant Permission" size="md">
    <form @submit.prevent="handleSubmit" class="space-y-4">
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

      <!-- Action -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Action <span class="text-red-500">*</span>
        </label>
        <select v-model="form.action" required class="form-input">
          <option value="">Select action</option>
          <option value="create">Create</option>
          <option value="read">Read</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="approve">Approve</option>
          <option value="verify">Verify</option>
          <option value="export">Export</option>
          <option value="submit">Submit</option>
        </select>
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
          Allow grants the permission, Deny explicitly blocks it
        </p>
      </div>

      <!-- Resource ID (Optional) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Resource ID (Optional)
        </label>
        <input
          v-model="form.resourceId"
          type="text"
          class="form-input"
          placeholder="Leave empty for all resources"
        />
        <p class="mt-1 text-xs text-gray-500">
          Specify a resource UUID to limit permission to a single resource
        </p>
      </div>

      <!-- Expiration Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Expiration Date (Optional)
        </label>
        <input
          v-model="form.expiresAt"
          type="datetime-local"
          class="form-input"
        />
        <p class="mt-1 text-xs text-gray-500">
          Leave empty for permanent permission
        </p>
      </div>

      <!-- Reason -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Reason
        </label>
        <textarea
          v-model="form.reason"
          rows="2"
          class="form-input"
          placeholder="Why is this permission being granted?"
        />
      </div>

      <!-- Error Message -->
      <Alert v-if="error" type="error" :message="error" />
    </form>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="isOpen = false">Cancel</Button>
        <Button variant="primary" :loading="saving" @click="handleSubmit">
          Grant Permission
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
  (e: 'granted'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  resourceType: '',
  action: '',
  effect: 'allow' as 'allow' | 'deny',
  resourceId: '',
  expiresAt: '',
  reason: '',
});

const saving = ref(false);
const error = ref('');

watch(isOpen, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});

function resetForm() {
  form.value = {
    resourceType: '',
    action: '',
    effect: 'allow',
    resourceId: '',
    expiresAt: '',
    reason: '',
  };
  error.value = '';
}

async function handleSubmit() {
  error.value = '';
  saving.value = true;

  try {
    const data: any = {
      resourceType: form.value.resourceType,
      action: form.value.action,
      effect: form.value.effect,
    };

    if (form.value.resourceId) {
      data.resourceId = form.value.resourceId;
    }

    if (form.value.expiresAt) {
      data.expiresAt = new Date(form.value.expiresAt).toISOString();
    }

    if (form.value.reason) {
      data.reason = form.value.reason;
    }

    await api.post(`/users/${props.userId}/permissions`, data);
    emit('granted');
    resetForm();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to grant permission';
  } finally {
    saving.value = false;
  }
}
</script>
