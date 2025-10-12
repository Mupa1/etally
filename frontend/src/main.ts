/**
 * Election Management System - Frontend Entry Point
 * Vue 3 + Composition API + TypeScript
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Styles
import './assets/styles/main.css';

// Create Vue app
const app = createApp(App);

// Install plugins
app.use(createPinia());
app.use(router);

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err);
  console.error('Component:', instance);
  console.error('Error info:', info);
};

// Mount app
app.mount('#app');

// Register service worker for offline support (optional)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js');
}
