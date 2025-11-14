<template>
  <Modal
    v-model="isOpen"
    :title="`${user?.firstName} ${user?.lastName}`"
    size="lg"
  >
    <div v-if="user" class="space-y-6">
      <!-- Basic Info -->
      <div>
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
          Basic Information
        </h3>
        <dl class="grid grid-cols-2 gap-4">
          <div>
            <dt class="text-xs text-gray-500">National ID</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ user.nationalId }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">Email</dt>
            <dd class="text-sm font-medium text-gray-900">{{ user.email }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">Phone Number</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ user.phoneNumber || 'N/A' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">Role</dt>
            <dd>
              <Badge :variant="getRoleBadgeVariant(user.role)">
                {{ formatRole(user.role) }}
              </Badge>
            </dd>
          </div>
        </dl>
      </div>

      <!-- Status -->
      <div>
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Status</h3>
        <dl class="grid grid-cols-2 gap-4">
          <div>
            <dt class="text-xs text-gray-500">Account Status</dt>
            <dd>
              <Badge :variant="user.isActive ? 'success' : 'secondary'">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </Badge>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">Registration Status</dt>
            <dd>
              <Badge
                :variant="getRegistrationBadgeVariant(user.registrationStatus)"
              >
                {{ formatRegistrationStatus(user.registrationStatus) }}
              </Badge>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">Last Login</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ user.lastLogin ? formatDateTime(user.lastLogin) : 'Never' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">Member Since</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ formatDate(user.createdAt) }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Geographic Scopes -->
      <div v-if="user.scopes && user.scopes.length > 0">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
          Geographic Scopes
        </h3>
        <div class="space-y-2">
          <div
            v-for="scope in user.scopes"
            :key="scope.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <Badge :variant="getScopeLevelColor(scope.scopeLevel)">
                {{ formatScopeLevel(scope.scopeLevel) }}
              </Badge>
              <span class="text-sm text-gray-900">
                {{ getScopeLabel(scope) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="pt-4 border-t border-gray-200">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div class="flex gap-2">
          <Button variant="secondary" size="sm" @click="goToScopes">
            Manage Scopes
          </Button>
          <Button variant="secondary" size="sm" @click="goToPermissions">
            Manage Permissions
          </Button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-end">
        <Button variant="secondary" @click="isOpen = false">Close</Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';

interface Props {
  modelValue: boolean;
  user?: any | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const router = useRouter();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function getRoleBadgeVariant(role: string): string {
  const variants: Record<string, string> = {
    super_admin: 'danger',
    election_manager: 'primary',
    field_observer: 'success',
    public_viewer: 'secondary',
  };
  return variants[role] || 'secondary';
}

function formatRole(role: string): string {
  const roles: Record<string, string> = {
    super_admin: 'Super Admin',
    election_manager: 'Election Manager',
    field_observer: 'Field Agent',
    public_viewer: 'Public Viewer',
  };
  return roles[role] || role;
}

function getRegistrationBadgeVariant(status: string): string {
  const variants: Record<string, string> = {
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return variants[status] || 'secondary';
}

function formatRegistrationStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getScopeLevelColor(level: string): string {
  const colors: Record<string, string> = {
    national: 'primary',
    county: 'success',
    constituency: 'warning',
    ward: 'secondary',
  };
  return colors[level] || 'secondary';
}

function formatScopeLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function getScopeLabel(scope: any): string {
  if (scope.scopeLevel === 'national') return 'National';
  if (scope.county) return scope.county.name;
  if (scope.constituency) return scope.constituency.name;
  if (scope.ward) return scope.ward.name;
  return scope.scopeLevel;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function goToScopes() {
  isOpen.value = false;
  router.push('/admin/scopes');
}

function goToPermissions() {
  isOpen.value = false;
  router.push('/admin/permissions');
}
</script>
