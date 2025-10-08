<template>
  <div class="card">
    <h3 class="text-lg font-semibold mb-4">Example Results Chart</h3>
    <div class="h-64">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// Props
interface Props {
  data?: Array<{ name: string; votes: number }>;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [
    { name: 'Candidate A', votes: 12500 },
    { name: 'Candidate B', votes: 19800 },
    { name: 'Candidate C', votes: 8300 },
  ],
});

// Chart data
const chartData = computed(() => ({
  labels: props.data.map(d => d.name),
  datasets: [
    {
      label: 'Votes',
      data: props.data.map(d => d.votes),
      backgroundColor: ['#0ea5e9', '#22c55e', '#f59e0b'],
      borderColor: ['#0284c7', '#16a34a', '#d97706'],
      borderWidth: 2,
    }
  ]
}));

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: 'Votes by Candidate'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => value.toLocaleString()
      }
    }
  }
};
</script>
