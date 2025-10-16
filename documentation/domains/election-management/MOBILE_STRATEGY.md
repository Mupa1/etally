# Mobile Result Submission Strategy

## 🎯 Key Requirement: **Offline-First Architecture**

Field observers must be able to submit election results **even when offline**. Results sync automatically when internet connection is restored.

---

## Implementation Options

### Option 1: Progressive Web App (PWA) - ⭐ **Recommended**

**Advantages**:

- ✅ No app store approval needed (instant deployment)
- ✅ Works on iOS and Android via web browser
- ✅ Single codebase (Vue.js/TypeScript)
- ✅ Easy updates (no app store delays)
- ✅ Smaller download size
- ✅ Installable to home screen ("Add to Home Screen")
- ✅ Lower development and maintenance cost

**Features**:

- Result submission form with camera integration (HTML5)
- GPS location capture and validation
- Form 34A photo upload (camera or file picker)
- Offline queue management with IndexedDB
- Real-time sync status indicator
- Background sync when connection restored

**Offline Implementation**:

```typescript
// Service Worker (public/sw.js)
const CACHE_NAME = 'election-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/main.js',
  '/assets/main.css',
  '/assets/logo.png',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch - serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Background Sync - auto-sync when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-results') {
    event.waitUntil(syncPendingResults());
  }
});

async function syncPendingResults() {
  const db = await openDB('election-app');
  const pending = await db.getAll('pending-results');

  for (const result of pending) {
    try {
      const response = await fetch('/api/v1/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getStoredToken()}`,
        },
        body: JSON.stringify(result),
      });

      if (response.ok) {
        // Remove from queue after successful sync
        await db.delete('pending-results', result.id);
      }
    } catch (error) {
      console.error('Sync failed for result', result.id);
      // Keeps in queue for next retry
    }
  }
}
```

**IndexedDB Storage**:

```typescript
// composables/useOfflineStorage.ts
import { openDB, DBSchema } from 'idb';

interface ElectionDB extends DBSchema {
  'pending-results': {
    key: string;
    value: {
      id: string;
      electionId: string;
      contestId: string;
      candidateId: string;
      pollingStationId: string;
      votes: number;
      latitude: number;
      longitude: number;
      accuracyMeters: number;
      photos: string[]; // Base64 or blob URLs
      timestamp: string;
      synced: boolean;
    };
    indexes: { 'by-timestamp': string; 'by-synced': boolean };
  };
  elections: {
    key: string;
    value: any;
  };
  candidates: {
    key: string;
    value: any;
  };
  'polling-stations': {
    key: string;
    value: any;
  };
}

const dbPromise = openDB<ElectionDB>('election-app', 2, {
  upgrade(db) {
    // Pending results queue
    const resultsStore = db.createObjectStore('pending-results', {
      keyPath: 'id',
    });
    resultsStore.createIndex('by-timestamp', 'timestamp');
    resultsStore.createIndex('by-synced', 'synced');

    // Reference data (cached from API)
    db.createObjectStore('elections', { keyPath: 'id' });
    db.createObjectStore('candidates', { keyPath: 'id' });
    db.createObjectStore('polling-stations', { keyPath: 'id' });
  },
});

// Submit result with offline support
export async function submitResult(resultData: any) {
  const db = await dbPromise;
  const resultId = crypto.randomUUID();

  const result = {
    id: resultId,
    ...resultData,
    timestamp: new Date().toISOString(),
    synced: false,
  };

  // Always save to IndexedDB first (offline-first)
  await db.add('pending-results', result);

  // Try immediate sync if online
  if (navigator.onLine) {
    try {
      const response = await fetch('/api/v1/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      if (response.ok) {
        // Mark as synced
        result.synced = true;
        await db.put('pending-results', result);
        return { success: true, synced: true };
      }
    } catch (error) {
      console.log('Offline - queued for sync');
    }
  }

  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in registration) {
    await registration.sync.register('sync-results');
  }

  return { success: true, synced: false, queued: true };
}

// Get pending results count
export async function getPendingCount() {
  const db = await dbPromise;
  const results = await db.getAllFromIndex(
    'pending-results',
    'by-synced',
    false
  );
  return results.length;
}

// Manual sync trigger
export async function manualSync() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-results');
  }
}
```

**Vue Component Example**:

```vue
<!-- components/ResultSubmission.vue -->
<template>
  <div class="result-submission">
    <div v-if="!isOnline" class="offline-banner">
      📡 Offline Mode - Results will sync when online
      <button @click="manualSync" class="sync-btn">
        Retry Sync ({{ pendingCount }})
      </button>
    </div>

    <form @submit.prevent="handleSubmit">
      <select v-model="form.contestId" required>
        <option
          v-for="contest in contests"
          :key="contest.id"
          :value="contest.id"
        >
          {{ contest.positionName }}
        </option>
      </select>

      <select v-model="form.candidateId" required>
        <option
          v-for="candidate in candidates"
          :key="candidate.id"
          :value="candidate.id"
        >
          {{ candidate.fullName }}
        </option>
      </select>

      <input
        v-model.number="form.votes"
        type="number"
        min="0"
        required
        placeholder="Vote Count"
      />

      <input
        type="file"
        accept="image/*"
        capture="environment"
        @change="handlePhotoUpload"
      />

      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Submitting...' : 'Submit Result' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  submitResult,
  getPendingCount,
  manualSync,
} from '@/composables/useOfflineStorage';

const isOnline = ref(navigator.onLine);
const pendingCount = ref(0);
const submitting = ref(false);
const form = ref({
  electionId: '',
  contestId: '',
  candidateId: '',
  pollingStationId: '',
  votes: 0,
  photos: [],
});

// Update online status
window.addEventListener('online', () => {
  isOnline.value = true;
  manualSync();
});
window.addEventListener('offline', () => (isOnline.value = false));

// Load pending count
onMounted(async () => {
  pendingCount.value = await getPendingCount();
});

async function handleSubmit() {
  submitting.value = true;

  // Get GPS location
  const position = await navigator.geolocation.getCurrentPosition();
  form.value.latitude = position.coords.latitude;
  form.value.longitude = position.coords.longitude;
  form.value.accuracyMeters = position.coords.accuracy;

  try {
    const result = await submitResult(form.value);

    if (result.synced) {
      alert('✅ Result submitted successfully!');
    } else {
      alert('📥 Result queued for sync when online');
    }

    // Reset form
    form.value.votes = 0;
    form.value.photos = [];

    // Update pending count
    pendingCount.value = await getPendingCount();
  } catch (error) {
    alert('❌ Error: ' + error.message);
  } finally {
    submitting.value = false;
  }
}
</script>
```

---

### Option 2: Independent Mobile App (React Native) - **Future Enhancement**

**Advantages**:

- ✅ Better native performance
- ✅ Better camera integration (native modules)
- ✅ More robust offline storage (SQLite)
- ✅ Push notifications
- ✅ Better UX for mobile-first users
- ❌ Requires app store approval (1-2 weeks)
- ❌ Separate iOS and Android builds
- ❌ Higher development cost
- ❌ More complex maintenance

**When to Consider**:

- If PWA performance is insufficient
- If you need push notifications
- If you need advanced native features
- If budget allows for additional development

---

### Option 3: Hybrid Approach (**Both PWA + Native App**)

**Strategy**:

1. **Phase 1**: Launch with PWA (fast time to market)
2. **Phase 2**: Monitor usage and performance
3. **Phase 3**: Add React Native app if needed (Phase 6+)
4. Both share same backend API
5. Same offline sync mechanisms

---

## Decision Matrix

| Criteria          | PWA                        | React Native             | Both            |
| ----------------- | -------------------------- | ------------------------ | --------------- |
| Time to Market    | ⚡ 2-3 weeks               | 🐌 4-6 weeks             | 📊 Phased       |
| Deployment        | ✅ Instant                 | ❌ App Store (1-2 weeks) | 📱 Progressive  |
| Updates           | ✅ Instant                 | ❌ Requires approval     | 📱 PWA faster   |
| Offline Support   | ✅ Excellent               | ✅ Excellent             | ✅ Excellent    |
| Camera Access     | ⚠️ Good (HTML5)            | ✅ Excellent (Native)    | ✅ Best         |
| GPS Accuracy      | ⚠️ Good                    | ✅ Excellent             | ✅ Best         |
| Cost              | 💰 $5K-10K                 | 💰💰 $20K-30K            | 💰💰💰 $25K-40K |
| Maintenance       | 🔧 Easy                    | 🔧🔧 Moderate            | 🔧🔧🔧 Complex  |
| Platform Coverage | 📱 iOS + Android + Desktop | 📱 iOS + Android only    | 📱📱 Maximum    |

---

## ✅ Recommended Strategy

**For etally2 Election Management System:**

### **Short-term (Phases 1-5)**: Progressive Web App (PWA)

- Faster time to market
- Lower cost
- Easier updates
- Good offline support
- Wide device compatibility

### **Long-term (Phase 6+)**: Evaluate adding React Native

- Based on user feedback
- If native performance is critical
- If budget allows

### **Key Implementation Points**:

1. ✅ Build PWA first with robust offline support
2. ✅ Use IndexedDB for local storage (unlimited capacity)
3. ✅ Implement Service Worker with Background Sync
4. ✅ Test extensively on low-connectivity scenarios
5. ✅ Add manual sync button as fallback
6. ✅ Show clear sync status indicators
7. ✅ Keep it simple and reliable

---

## Testing Requirements

### Offline Scenarios to Test:

- ✅ Submit result with no connectivity
- ✅ Verify data saved to IndexedDB
- ✅ Go online and verify auto-sync
- ✅ Submit multiple results offline
- ✅ Verify sync order (FIFO)
- ✅ Test with intermittent connectivity
- ✅ Test with slow 2G connection
- ✅ Verify photo uploads with large files
- ✅ Test battery impact of background sync
- ✅ Test storage limits (IndexedDB quota)

---

**Last Updated**: October 16, 2024
**Status**: ✅ APPROVED - PWA Implementation
**Next Review**: Post-Phase 2 Completion
