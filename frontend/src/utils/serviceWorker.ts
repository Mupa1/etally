/**
 * Service Worker Registration and Management
 * Handles service worker registration, updates, and offline functionality
 */

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Register service worker
   */
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is available
              this.showUpdateNotification();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Check if service worker is supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Check if service worker is registered
   */
  isRegistered(): boolean {
    return this.registration !== null;
  }

  /**
   * Get service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Check online status
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });

    // Service worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('App is online');

    // Show online notification
    this.showNotification('Connection Restored', 'You are back online!');

    // Trigger background sync if available
    if (this.registration?.sync) {
      this.registration.sync.register('background-sync');
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('App is offline');

    // Show offline notification
    this.showNotification(
      'Offline Mode',
      'You are now offline. Some features may be limited.'
    );
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(data: any): void {
    console.log('Message from service worker:', data);

    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.cacheName);
        break;
      case 'OFFLINE_READY':
        console.log('App is ready for offline use');
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    if (
      confirm(
        'A new version of the app is available. Would you like to update?'
      )
    ) {
      window.location.reload();
    }
  }

  /**
   * Show notification
   */
  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Send message to service worker
   */
  sendMessage(message: any): void {
    if (this.registration?.active) {
      this.registration.active.postMessage(message);
    }
  }

  /**
   * Get cache information
   */
  async getCacheInfo(): Promise<{ name: string; size: number }[]> {
    if (!('caches' in window)) {
      return [];
    }

    const cacheNames = await caches.keys();
    const cacheInfo = [];

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheInfo.push({
        name: cacheName,
        size: keys.length,
      });
    }

    return cacheInfo;
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('All caches cleared');
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// Export convenience functions
export async function registerServiceWorker(): Promise<boolean> {
  return serviceWorkerManager.register();
}

export async function unregisterServiceWorker(): Promise<boolean> {
  return serviceWorkerManager.unregister();
}

export function isServiceWorkerSupported(): boolean {
  return serviceWorkerManager.isSupported();
}

export function isOnline(): boolean {
  return serviceWorkerManager.isOnlineStatus();
}
