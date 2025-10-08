<template>
  <MainLayout
    page-title="Dashboard"
    page-description="Overview of elections, candidates, and real-time results"
  >
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatsCard
        label="Total Elections"
        :value="stats.totalElections"
        icon="elections"
        color="primary"
      />
      <StatsCard
        label="Active Candidates"
        :value="stats.activeCandidates"
        icon="candidates"
        color="success"
      />
      <StatsCard
        label="Results Submitted"
        :value="stats.resultsSubmitted"
        icon="results"
        color="warning"
      />
      <StatsCard
        label="Polling Stations"
        :value="stats.pollingStations"
        icon="location"
        color="secondary"
      />
    </div>

    <!-- Quick Actions -->
    <div class="card mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Create Election"
          description="Set up new election"
          to="/elections/create"
          icon="plus"
        />
        <QuickActionCard
          title="Manage Candidates"
          description="Add or edit candidates"
          to="/candidates"
          icon="user-add"
        />
        <QuickActionCard
          title="View Live Results"
          description="Real-time election results"
          to="/results/live"
          icon="chart"
        />
      </div>
    </div>

    <!-- System Status -->
    <SystemStatus :services="systemServices" @refresh="checkSystemStatus" />
  </MainLayout>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import StatsCard from '@/components/dashboard/StatsCard.vue';
import QuickActionCard from '@/components/dashboard/QuickActionCard.vue';
import SystemStatus from '@/components/dashboard/SystemStatus.vue';

// Dashboard stats (will be loaded from API later)
const stats = reactive({
  totalElections: 0,
  activeCandidates: 0,
  resultsSubmitted: 0,
  pollingStations: 0,
});

// System services status
const systemServices = reactive([
  {
    name: 'database',
    label: 'Database Connection',
    status: 'healthy' as const,
  },
  { name: 'api', label: 'API Service', status: 'healthy' as const },
  { name: 'cache', label: 'Cache Service', status: 'healthy' as const },
]);

function checkSystemStatus() {
  // TODO: Implement actual health check
  console.log('Checking system status...');
}
</script>
