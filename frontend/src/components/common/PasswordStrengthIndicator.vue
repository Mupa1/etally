<template>
  <div v-if="showIndicator" class="space-y-2">
    <p class="text-xs font-medium text-gray-700">{{ title }}</p>
    <ul class="space-y-1">
      <li
        v-for="check in checks"
        :key="check.key"
        :class="check.passed ? 'text-green-600' : 'text-gray-500'"
        class="flex items-center text-xs transition-colors"
      >
        <svg
          class="h-4 w-4 mr-2 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            v-if="check.passed"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
          <circle
            v-else
            cx="12"
            cy="12"
            r="10"
            stroke-width="2"
          />
        </svg>
        {{ check.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  password: string;
  showIndicator?: boolean;
  title?: string;
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
  specialChars?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showIndicator: true,
  title: 'Password Requirements:',
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*(),.?":{}|<>',
});

interface PasswordCheck {
  key: string;
  label: string;
  passed: boolean;
}

const checks = computed<PasswordCheck[]>(() => {
  const password = props.password;
  const checkList: PasswordCheck[] = [];

  // Length check
  checkList.push({
    key: 'length',
    label: `At least ${props.minLength} characters`,
    passed: password.length >= props.minLength,
  });

  // Uppercase check
  if (props.requireUppercase) {
    checkList.push({
      key: 'uppercase',
      label: 'One uppercase letter (A-Z)',
      passed: /[A-Z]/.test(password),
    });
  }

  // Lowercase check
  if (props.requireLowercase) {
    checkList.push({
      key: 'lowercase',
      label: 'One lowercase letter (a-z)',
      passed: /[a-z]/.test(password),
    });
  }

  // Number check
  if (props.requireNumber) {
    checkList.push({
      key: 'number',
      label: 'One number (0-9)',
      passed: /[0-9]/.test(password),
    });
  }

  // Special character check
  if (props.requireSpecial) {
    // Escape special regex characters
    const escapedChars = props.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const specialRegex = new RegExp(`[${escapedChars}]`);
    
    checkList.push({
      key: 'special',
      label: `One special character (${props.specialChars})`,
      passed: specialRegex.test(password),
    });
  }

  return checkList;
});

// Expose whether all checks pass
const isValid = computed(() => {
  return checks.value.every((check) => check.passed);
});

defineExpose({
  isValid,
  checks,
});
</script>

