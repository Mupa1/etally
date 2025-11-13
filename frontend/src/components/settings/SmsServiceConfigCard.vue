<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
    >
      <div>
        <h2 class="text-xl font-semibold text-gray-900">
          SMS Service Configuration
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          Configure Africa's Talking credentials for outbound SMS notifications.
        </p>
      </div>
      <Badge variant="primary">
        Provider: {{ form.provider.toUpperCase() }}
      </Badge>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        v-model="form.provider"
        label="SMS Provider"
        :options="providerOptions"
        :disabled="true"
        help-text="Africa's Talking is currently supported. Additional providers coming soon."
      />
      <FormField
        v-model="form.username"
        label="Africa's Talking Username"
        placeholder="yourAppUsername"
        required
      />
      <FormField
        v-model="form.apiKey"
        label="Africa's Talking API Key"
        type="password"
        :placeholder="
          hasExistingApiKey
            ? '•••••••• (stored - leave blank to keep current)'
            : 'Enter Africa\'s Talking API key'
        "
      />
      <FormField
        v-model="form.senderId"
        label="Sender ID (optional)"
        placeholder="ABC"
        help-text="Use a registered sender ID or leave blank to use the default."
      />
      <FormField
        v-model="form.maskedNumber"
        label="Masked Number / Short Code (optional)"
        placeholder="12345"
      />
      <FormField
        v-model="form.telco"
        label="Preferred Telco (optional)"
        placeholder="Safaricom"
      />
      <FormField
        v-model="form.baseUrl"
        label="API Base URL"
        placeholder="https://api.africastalking.com"
        required
      />
      <FormField
        v-model="form.bulkEndpoint"
        label="Bulk Messaging Endpoint"
        placeholder="/version1/messaging/bulk"
        required
      />
      <FormField
        v-model="form.maxRetry"
        type="number"
        label="Retry Attempts"
        placeholder="3"
        required
        help-text="Number of times to retry failed SMS sends."
      />
      <FormField
        v-model="form.timeout"
        type="number"
        label="Request Timeout (seconds)"
        placeholder="30"
        required
      />
    </div>

    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2"
    >
      <div class="text-xs text-gray-500 space-y-1">
        <p>
          Changes apply immediately. Send a test SMS afterwards to confirm
          delivery.
        </p>
        <p>
          Ensure your sender ID or short code is provisioned on Africa's Talking
          before using it in production.
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          :disabled="saving"
          @click="resetForm"
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="primary"
          :loading="saving"
          :disabled="!isValid"
          @click="saveConfiguration"
        >
          Save Changes
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Select from '@/components/common/Select.vue';
import FormField from '@/components/mobile/FormField.vue';
import api from '@/utils/api';
import { useToast } from '@/composables/useToast';

interface Configuration {
  id: string;
  key: string;
  name: string;
  description: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  isRequired: boolean;
  isDefault: boolean;
  lastModified?: Date;
}

const props = defineProps<{
  settings: Configuration[];
}>();

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const toast = useToast();
const saving = ref(false);

const providerOptions = [
  { label: "Africa's Talking", value: 'africastalking' },
];

const form = reactive({
  provider: 'africastalking',
  username: '',
  apiKey: '',
  senderId: '',
  maskedNumber: '',
  telco: '',
  baseUrl: 'https://api.africastalking.com',
  bulkEndpoint: '/version1/messaging/bulk',
  maxRetry: '3',
  timeout: '30',
});

function toStringValue(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

const configMap = computed(() => {
  const map = new Map<string, Configuration>();
  props.settings.forEach((setting) => {
    map.set(setting.key, setting);
  });
  return map;
});

const hasExistingApiKey = computed(() => {
  const raw = configMap.value.get('africastalking_api_key')?.value;
  return raw !== undefined && raw !== null && String(raw).trim().length > 0;
});

watch(
  configMap,
  (map) => {
    if (!map.size) {
      return;
    }

    form.provider =
      toStringValue(map.get('sms_provider')?.value, 'africastalking') ||
      'africastalking';
    form.username = toStringValue(map.get('africastalking_username')?.value);
    form.apiKey = '';
    form.senderId = toStringValue(map.get('africastalking_sender_id')?.value);
    form.maskedNumber = toStringValue(
      map.get('africastalking_masked_number')?.value
    );
    form.telco = toStringValue(map.get('africastalking_telco')?.value);
    form.baseUrl = toStringValue(
      map.get('africastalking_base_url')?.value,
      'https://api.africastalking.com'
    );
    form.bulkEndpoint = toStringValue(
      map.get('africastalking_bulk_endpoint')?.value,
      '/version1/messaging/bulk'
    );
    form.maxRetry = toStringValue(map.get('sms_max_retry')?.value, '3');
    form.timeout = toStringValue(map.get('sms_timeout')?.value, '30');
  },
  { immediate: true }
);

function resetForm() {
  const map = configMap.value;
  if (!map.size) {
    return;
  }

  form.provider =
    toStringValue(map.get('sms_provider')?.value, 'africastalking') ||
    'africastalking';
  form.username = toStringValue(map.get('africastalking_username')?.value);
  form.apiKey = '';
  form.senderId = toStringValue(map.get('africastalking_sender_id')?.value);
  form.maskedNumber = toStringValue(
    map.get('africastalking_masked_number')?.value
  );
  form.telco = toStringValue(map.get('africastalking_telco')?.value);
  form.baseUrl = toStringValue(
    map.get('africastalking_base_url')?.value,
    'https://api.africastalking.com'
  );
  form.bulkEndpoint = toStringValue(
    map.get('africastalking_bulk_endpoint')?.value,
    '/version1/messaging/bulk'
  );
  form.maxRetry = toStringValue(map.get('sms_max_retry')?.value, '3');
  form.timeout = toStringValue(map.get('sms_timeout')?.value, '30');
}

type ConfigValueType = 'string' | 'number' | 'boolean' | 'json';

interface ConfigDefinition {
  name: string;
  description: string;
  type: ConfigValueType;
  category: string;
  isRequired?: boolean;
  isDefault?: boolean;
  allowEmpty?: boolean;
  defaultValue?: any;
}

const CONFIG_CATEGORY = 'sms';

const configDefinitions: Record<string, ConfigDefinition> = {
  sms_provider: {
    name: 'SMS Provider',
    description: 'SMS delivery provider (africastalking)',
    type: 'string',
    category: CONFIG_CATEGORY,
  },
  africastalking_username: {
    name: "Africa's Talking Username",
    description: "Africa's Talking application username",
    type: 'string',
    category: CONFIG_CATEGORY,
  },
  africastalking_api_key: {
    name: "Africa's Talking API Key",
    description: "Africa's Talking API key (stored encrypted)",
    type: 'string',
    category: CONFIG_CATEGORY,
    allowEmpty: true,
  },
  africastalking_sender_id: {
    name: 'Sender ID',
    description: 'Registered sender ID for branded SMS (optional)',
    type: 'string',
    category: CONFIG_CATEGORY,
    allowEmpty: true,
  },
  africastalking_masked_number: {
    name: 'Masked Number',
    description: 'Masked number or short code for SMS (optional)',
    type: 'string',
    category: CONFIG_CATEGORY,
    allowEmpty: true,
  },
  africastalking_telco: {
    name: 'Telco',
    description: 'Preferred telco for SMS routing (optional)',
    type: 'string',
    category: CONFIG_CATEGORY,
    allowEmpty: true,
  },
  africastalking_base_url: {
    name: 'API Base URL',
    description: "Base URL for Africa's Talking API",
    type: 'string',
    category: CONFIG_CATEGORY,
    allowEmpty: true,
    defaultValue: 'https://api.africastalking.com',
  },
  africastalking_bulk_endpoint: {
    name: 'Bulk Endpoint',
    description: 'Bulk messaging endpoint path',
    type: 'string',
    category: CONFIG_CATEGORY,
    allowEmpty: true,
    defaultValue: '/version1/messaging/bulk',
  },
  sms_max_retry: {
    name: 'SMS Maximum Retry Attempts',
    description: 'Number of times to retry failed SMS messages',
    type: 'number',
    category: CONFIG_CATEGORY,
  },
  sms_timeout: {
    name: 'SMS Request Timeout',
    description: 'Timeout for SMS requests in seconds',
    type: 'number',
    category: CONFIG_CATEGORY,
  },
};

function normalizeValueForConfig(key: string, value: any): any {
  const def = configDefinitions[key];
  if (!def) {
    return value;
  }

  switch (def.type) {
    case 'number': {
      if (typeof value === 'number') {
        return value;
      }
      const normalized = Number(
        typeof value === 'string' ? value.trim() : (value ?? NaN)
      );
      return Number.isNaN(normalized) ? undefined : normalized;
    }
    case 'boolean': {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
          return true;
        }
        if (normalized === 'false' || normalized === '0') {
          return false;
        }
      }
      return Boolean(value);
    }
    case 'json': {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return undefined;
        }
      }
      return value;
    }
    default: {
      if (typeof value === 'string') {
        return value.trim();
      }
      if (value === null || value === undefined) {
        return '';
      }
      return String(value);
    }
  }
}

function serializeValueForConfig(key: string, value: any): string {
  const def = configDefinitions[key];
  if (!def) {
    return value === undefined || value === null ? '' : String(value);
  }

  switch (def.type) {
    case 'number':
      return value === undefined || value === null ? '' : String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'json':
      return value === undefined || value === null ? '' : JSON.stringify(value);
    default:
      return value === undefined || value === null ? '' : String(value);
  }
}

function isEmptyValue(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  );
}

async function upsertConfig(
  key: string,
  rawValue: any,
  options: { allowEmpty?: boolean } = {}
) {
  const def = configDefinitions[key];

  if (!def) {
    console.warn(`No configuration definition found for key "${key}".`);
    return;
  }

  let normalized = normalizeValueForConfig(key, rawValue);
  const empty = isEmptyValue(normalized);
  const existing = configMap.value.get(key);
  const serializedExisting =
    existing !== undefined
      ? serializeValueForConfig(key, existing.value)
      : undefined;

  if (existing) {
    if (empty && !options.allowEmpty) {
      return;
    }

    const payloadValue =
      empty && options.allowEmpty
        ? ''
        : serializeValueForConfig(key, normalized);

    if (payloadValue === serializedExisting) {
      return;
    }

    await api.patch(`/configurations/key/${key}`, {
      value: payloadValue,
    });
    return;
  }

  if (empty && !options.allowEmpty) {
    return;
  }

  if (empty && options.allowEmpty) {
    if (def.defaultValue !== undefined) {
      normalized = normalizeValueForConfig(key, def.defaultValue);
    } else {
      return;
    }
  }

  if (normalized === undefined) {
    return;
  }

  const serialized = serializeValueForConfig(key, normalized);

  await api.post('/configurations', {
    key,
    name: def.name,
    description: def.description,
    value: serialized,
    type: def.type,
    category: def.category,
    isRequired: def.isRequired ?? true,
    isDefault: def.isDefault ?? false,
  });
}

const isValid = computed(() => {
  const hasUsername = form.username.trim().length > 0;
  const hasApiKey = hasExistingApiKey.value || form.apiKey.trim().length > 0;
  const retriesValid = Number(form.maxRetry) > 0;
  const timeoutValid = Number(form.timeout) > 0;

  return hasUsername && hasApiKey && retriesValid && timeoutValid;
});

interface ConfigOperation {
  key: string;
  value: any;
  allowEmpty?: boolean;
}

async function saveConfiguration() {
  saving.value = true;
  try {
    const operations: ConfigOperation[] = [
      { key: 'sms_provider', value: form.provider },
      { key: 'africastalking_username', value: form.username.trim() },
      {
        key: 'africastalking_sender_id',
        value: form.senderId.trim(),
        allowEmpty: true,
      },
      {
        key: 'africastalking_masked_number',
        value: form.maskedNumber.trim(),
        allowEmpty: true,
      },
      {
        key: 'africastalking_telco',
        value: form.telco.trim(),
        allowEmpty: true,
      },
      {
        key: 'africastalking_base_url',
        value: form.baseUrl.trim() || 'https://api.africastalking.com',
        allowEmpty: true,
      },
      {
        key: 'africastalking_bulk_endpoint',
        value: form.bulkEndpoint.trim() || '/version1/messaging/bulk',
        allowEmpty: true,
      },
      { key: 'sms_max_retry', value: form.maxRetry.trim() || '3' },
      { key: 'sms_timeout', value: form.timeout.trim() || '30' },
    ];

    const apiKeyValue = form.apiKey.trim();
    const existingApiKeyConfig = configMap.value.get('africastalking_api_key');
    if (apiKeyValue.length > 0 || !existingApiKeyConfig) {
      operations.push({
        key: 'africastalking_api_key',
        value: apiKeyValue,
        allowEmpty: true,
      });
    }

    for (const operation of operations) {
      await upsertConfig(operation.key, operation.value, {
        allowEmpty: operation.allowEmpty,
      });
    }

    toast.success('SMS service configuration updated successfully.');
    form.apiKey = '';
    emit('updated');
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      'Failed to update SMS configuration. Please try again.';
    toast.error(message);
  } finally {
    saving.value = false;
  }
}
</script>
