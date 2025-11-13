<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Send Test SMS</h2>
        <p class="text-sm text-gray-600 mt-1">
          Verify that the configured SMS provider can successfully deliver messages.
        </p>
      </div>
      <Badge variant="info">Jambo Bulk SMS</Badge>
    </div>

    <Alert
      v-if="error"
      variant="danger"
      :message="error"
      class="mb-2"
      :dismissible="true"
      @dismiss="error = null"
    />
    <Alert
      v-else-if="result"
      variant="success"
      :message="`Test SMS sent to ${result.recipients.join(', ')}`"
      class="mb-2"
    />

    <form class="space-y-4" @submit.prevent="sendTestSms">
      <FormField
        v-model="form.phoneNumber"
        label="Recipient Phone Number"
        placeholder="+254711XXXYYY"
        required
      />
      <FormField
        v-model="form.message"
        label="Message"
        type="textarea"
        :rows="4"
        placeholder="This is a diagnostic SMS from eTally..."
      />

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <p class="text-xs text-gray-500">
          The message body includes sender details for easier troubleshooting.
        </p>
        <div class="flex gap-2">
          <Button type="button" variant="secondary" :disabled="loading" @click="resetForm">
            Reset
          </Button>
          <Button type="submit" variant="primary" :loading="loading" :disabled="!form.phoneNumber">
            Send Test SMS
          </Button>
        </div>
      </div>
    </form>

    <div
      v-if="result"
      class="border border-gray-100 rounded-lg p-4 bg-gray-50 space-y-4 text-sm text-gray-700"
    >
      <div>
        <h3 class="text-sm font-semibold text-gray-800">Delivery Summary</h3>
        <dl class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <dt class="font-medium text-gray-600">Sent At</dt>
            <dd>{{ formatDateTime(result.sentAt) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-gray-600">Recipients</dt>
            <dd>{{ result.recipients.join(', ') }}</dd>
          </div>
          <div>
            <dt class="font-medium text-gray-600">Message</dt>
            <dd>{{ result.message }}</dd>
          </div>
          <div>
            <dt class="font-medium text-gray-600">Attempts</dt>
            <dd>#{{ result.attempt }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="result.providerResponse">
        <h4 class="text-sm font-semibold text-gray-800 mb-1">Provider Response</h4>
        <pre class="bg-white border border-gray-200 rounded-md p-3 overflow-x-auto text-xs">
{{ formattedProviderResponse }}
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import Button from '@/components/common/Button.vue';
import FormField from '@/components/mobile/FormField.vue';
import Badge from '@/components/common/Badge.vue';
import Alert from '@/components/common/Alert.vue';
import api from '@/utils/api';
import { useToast } from '@/composables/useToast';

interface SmsTestResult {
  provider: string;
  recipients: string[];
  message: string;
  attempt: number;
  sentAt: string;
  providerResponse?: any;
}

const toast = useToast();
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<SmsTestResult | null>(null);

const form = reactive({
  phoneNumber: '',
  message:
    'This is a diagnostic SMS from eTally to confirm that your SMS configuration is working correctly.',
});

function resetForm() {
  form.phoneNumber = '';
  form.message =
    'This is a diagnostic SMS from eTally to confirm that your SMS configuration is working correctly.';
  error.value = null;
  result.value = null;
}

function formatDateTime(value: string): string {
  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return value;
  }
}

const formattedProviderResponse = computed(() => {
  if (!result.value?.providerResponse) {
    return '';
  }
  return JSON.stringify(result.value.providerResponse, null, 2);
});

async function sendTestSms() {
  error.value = null;

  if (!form.phoneNumber.trim()) {
    error.value = 'Recipient phone number is required.';
    return;
  }

  loading.value = true;

  try {
    const payload = {
      phoneNumber: form.phoneNumber.trim(),
      message: form.message?.trim() || undefined,
    };

    const response = await api.post('/configurations/sms/test', payload);
    result.value = response.data.data as SmsTestResult;
    toast.success('Test SMS sent successfully.');
  } catch (err: any) {
    const message =
      err.response?.data?.message || 'Failed to send test SMS. Please check the logs for details.';
    error.value = message;
    toast.error(message);
  } finally {
    loading.value = false;
  }
}
</script>

