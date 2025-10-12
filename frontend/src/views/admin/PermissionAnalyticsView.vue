<template>
  <MainLayout
    page-title="Permission Analytics"
    page-description="System-wide permission statistics and insights"
  >
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Dashboard -->
    <div v-else class="space-y-6">
      <!-- Overall Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Checks"
          :value="stats.totalChecks"
          icon="check"
          color="primary"
        />
        <StatCard
          title="Granted"
          :value="stats.grantedCount"
          :percentage="stats.successRate"
          icon="check-circle"
          color="success"
        />
        <StatCard
          title="Denied"
          :value="stats.deniedCount"
          :percentage="100 - stats.successRate"
          icon="x-circle"
          color="danger"
        />
        <StatCard
          title="Avg Response Time"
          :value="`${stats.avgEvaluationTime}ms`"
          icon="clock"
          color="warning"
        />
      </div>

      <!-- Checks by Resource Type -->
      <div class="bg-white shadow-sm rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Checks by Resource Type
        </h2>
        <div class="space-y-3">
          <div
            v-for="item in stats.byResource"
            :key="item.resourceType"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3 flex-1">
              <Badge :variant="getResourceColor(item.resourceType)">
                {{ formatResourceType(item.resourceType) }}
              </Badge>
              <div class="flex-1">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-primary-600 h-2 rounded-full"
                    :style="{
                      width: `${(item.count / stats.totalChecks) * 100}%`,
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="ml-4 text-sm font-medium text-gray-900">
              {{ item.count }} ({{
                ((item.count / stats.totalChecks) * 100).toFixed(1)
              }}%)
            </div>
          </div>
        </div>
      </div>

      <!-- Checks by Action -->
      <div class="bg-white shadow-sm rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Checks by Action
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="item in stats.byAction"
            :key="item.action"
            class="p-4 border border-gray-200 rounded-lg"
          >
            <div class="text-sm text-gray-500 mb-1">{{ item.action }}</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ item.count }}
            </div>
          </div>
        </div>
      </div>

      <!-- Top Denial Reasons -->
      <div class="bg-white shadow-sm rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Top Denial Reasons
        </h2>
        <div class="space-y-2">
          <div
            v-for="(reason, index) in topDenialReasons"
            :key="index"
            class="flex justify-between items-center p-3 bg-red-50 rounded-lg"
          >
            <span class="text-sm text-gray-700">{{ reason.reason }}</span>
            <Badge variant="danger">{{ reason.count }}</Badge>
          </div>
        </div>
      </div>

      <!-- Recent Activity Timeline -->
      <div class="bg-white shadow-sm rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity (Last 24 Hours)
        </h2>
        <div class="space-y-3">
          <div
            v-for="item in recentActivity"
            :key="item.hour"
            class="flex items-center gap-4"
          >
            <div class="text-sm text-gray-500 w-20">{{ item.hour }}:00</div>
            <div class="flex-1">
              <div class="w-full bg-gray-200 rounded-full h-6 relative">
                <div
                  class="bg-green-500 h-6 rounded-l-full absolute left-0"
                  :style="{ width: `${(item.granted / item.total) * 100}%` }"
                />
                <div
                  class="bg-red-500 h-6 rounded-r-full absolute right-0"
                  :style="{ width: `${(item.denied / item.total) * 100}%` }"
                />
              </div>
            </div>
            <div class="text-sm text-gray-600 w-24">
              {{ item.total }} checks
            </div>
          </div>
        </div>
        <div class="mt-4 flex gap-6 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-green-500 rounded" />
            <span class="text-gray-600">Granted</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-red-500 rounded" />
            <span class="text-gray-600">Denied</span>
          </div>
        </div>
      </div>

      <!-- Active Policies -->
      <div class="bg-white shadow-sm rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Active Policies
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="policy in activePolicies"
            :key="policy.id"
            class="p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="font-medium text-gray-900">{{ policy.name }}</div>
              <Badge
                :variant="policy.effect === 'allow' ? 'success' : 'danger'"
              >
                {{ policy.effect }}
              </Badge>
            </div>
            <div class="text-sm text-gray-500">
              Priority: {{ policy.priority }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/utils/api';
import MainLayout from '@/components/layout/MainLayout.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Badge from '@/components/common/Badge.vue';
import StatCard from '@/components/admin/StatCard.vue';

interface Stats {
  totalChecks: number;
  grantedCount: number;
  deniedCount: number;
  successRate: number;
  avgEvaluationTime: number;
  byResource: Array<{ resourceType: string; count: number }>;
  byAction: Array<{ action: string; count: number }>;
}

const stats = ref<Stats>({
  totalChecks: 0,
  grantedCount: 0,
  deniedCount: 0,
  successRate: 0,
  avgEvaluationTime: 0,
  byResource: [],
  byAction: [],
});

const topDenialReasons = ref<Array<{ reason: string; count: number }>>([]);
const recentActivity = ref<
  Array<{ hour: number; total: number; granted: number; denied: number }>
>([]);
const activePolicies = ref<Array<any>>([]);
const loading = ref(false);

async function loadAnalytics() {
  loading.value = true;

  try {
    // Load system statistics
    const statsResponse = await api.get('/permissions/stats');
    stats.value = statsResponse.data.data;

    // Load active policies
    const policiesResponse = await api.get('/policies', {
      params: { isActive: true },
    });
    activePolicies.value = policiesResponse.data.data.slice(0, 6);

    // Mock recent activity data (would need a specific endpoint)
    generateMockRecentActivity();

    // Mock top denial reasons (would need a specific endpoint)
    generateMockDenialReasons();
  } catch (err) {
    console.error('Failed to load analytics:', err);
  } finally {
    loading.value = false;
  }
}

function generateMockRecentActivity() {
  const currentHour = new Date().getHours();
  recentActivity.value = Array.from({ length: 12 }, (_, i) => {
    const hour = (currentHour - 11 + i + 24) % 24;
    const total = Math.floor(Math.random() * 100) + 50;
    const granted = Math.floor(total * (0.7 + Math.random() * 0.2));
    return {
      hour,
      total,
      granted,
      denied: total - granted,
    };
  });
}

function generateMockDenialReasons() {
  topDenialReasons.value = [
    { reason: 'Outside geographic scope', count: 45 },
    { reason: 'Insufficient role permissions', count: 32 },
    { reason: 'Time-based restriction', count: 18 },
    { reason: 'Resource ownership required', count: 12 },
    { reason: 'Policy denied', count: 8 },
  ];
}

function getResourceColor(resourceType: string): string {
  const colors: Record<string, string> = {
    election: 'primary',
    election_result: 'success',
    candidate: 'warning',
    user: 'danger',
    incident: 'secondary',
  };
  return colors[resourceType] || 'secondary';
}

function formatResourceType(resourceType: string): string {
  return resourceType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

onMounted(() => {
  loadAnalytics();
});
</script>
