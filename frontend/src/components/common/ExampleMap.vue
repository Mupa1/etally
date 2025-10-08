<template>
  <div class="card">
    <h3 class="text-lg font-semibold mb-4">Example Polling Stations Map</h3>
    <div style="height: 500px" class="rounded-lg overflow-hidden">
      <LMap
        v-model:zoom="zoom"
        :center="center"
        :use-global-leaflet="false"
      >
        <!-- Map Tiles -->
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          layer-type="base"
          name="OpenStreetMap"
        />

        <!-- Markers for each polling station -->
        <LMarker
          v-for="station in pollingStations"
          :key="station.id"
          :lat-lng="[station.latitude, station.longitude]"
        >
          <LIcon :icon-url="markerIcon" :icon-size="[25, 41]" :icon-anchor="[12, 41]" />
          <LPopup>
            <div class="p-2">
              <h4 class="font-semibold text-sm">{{ station.name }}</h4>
              <p class="text-xs text-gray-600 mt-1">Code: {{ station.code }}</p>
              <p class="text-xs text-gray-600">Registered: {{ station.registeredVoters }}</p>
            </div>
          </LPopup>
        </LMarker>

        <!-- Circle showing 5km radius example -->
        <LCircle
          :lat-lng="center"
          :radius="5000"
          color="#0ea5e9"
          :fillColor="#0ea5e9"
          :fillOpacity="0.2"
        />
      </LMap>
    </div>

    <!-- Map Controls -->
    <div class="mt-4 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">Zoom:</span>
        <button @click="zoom--" class="px-2 py-1 bg-gray-200 rounded">-</button>
        <span class="text-sm font-medium">{{ zoom }}</span>
        <button @click="zoom++" class="px-2 py-1 bg-gray-200 rounded">+</button>
      </div>
      <button @click="centerOnNairobi" class="btn-secondary text-sm">
        Center on Nairobi
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LCircle } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';

// Map state
const zoom = ref(12);
const center = ref<[number, number]>([-1.2921, 36.8219]); // Nairobi

// Marker icon (using default Leaflet marker)
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';

// Sample polling stations data
const pollingStations = ref([
  {
    id: '1',
    code: 'PS-001',
    name: 'Nairobi Primary School',
    latitude: -1.2921,
    longitude: 36.8219,
    registeredVoters: 1500,
  },
  {
    id: '2',
    code: 'PS-002',
    name: 'Westlands Secondary',
    latitude: -1.2695,
    longitude: 36.8077,
    registeredVoters: 2100,
  },
  {
    id: '3',
    code: 'PS-003',
    name: 'Kibera Community Center',
    latitude: -1.3138,
    longitude: 36.7871,
    registeredVoters: 1800,
  },
]);

function centerOnNairobi() {
  center.value = [-1.2921, 36.8219];
  zoom.value = 12;
}
</script>
