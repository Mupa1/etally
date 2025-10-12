# Observer Registration - Implementation Roadmap

**Date:** October 8, 2025  
**Status:** Ready to Execute  
**Estimated Time:** 6 weeks (working one stage at a time)

---

## 📋 Implementation Stages

### Stage 1: Set Up Mobile Framework ✅ (Week 1 - Days 1-3)

### Stage 2: Implement Mobile Registration ✅ (Week 1-2 - Days 4-7)

### Stage 3: Backend Phase 1 - Schema & OTP System ✅ (Week 2 - Days 8-10)

### Stage 4: Backend Phase 1 - Prisma Migrations ✅ (Week 2 - Days 11-12)

### Stage 5: Backend Phase 1 - SMS Service Integration ✅ (Week 2-3 - Days 13-14)

### Stage 6: Complete Registration Flow Testing ✅ (Week 3 - Days 15-17)

---

## 🚀 STAGE 1: Set Up Mobile Framework

**Duration:** 3 days  
**Goal:** Create React Native mobile app with core architecture

### Tasks

#### Day 1: Project Setup

```bash
# Create React Native project with TypeScript
npx react-native@latest init eTallyMobile --template react-native-template-typescript

cd eTallyMobile

# Install core dependencies
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install axios
npm install @react-native-async-storage/async-storage
npm install react-native-dotenv
npm install react-native-device-info
npm install react-native-get-random-values  # For UUID
npm install uuid

# Development dependencies
npm install --save-dev @types/uuid
```

#### Day 2: Project Structure

Create the following directory structure:

```
eTallyMobile/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance
│   │   └── endpoints.ts           # API endpoint definitions
│   ├── config/
│   │   └── environment.ts         # Environment configuration
│   ├── constants/
│   │   └── colors.ts              # App colors
│   ├── navigation/
│   │   ├── AppNavigator.tsx       # Main navigation
│   │   └── AuthNavigator.tsx      # Auth-related screens
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── PhoneInputScreen.tsx
│   │   │   ├── OTPVerificationScreen.tsx
│   │   │   ├── CompleteRegistrationScreen.tsx
│   │   │   └── PendingApprovalScreen.tsx
│   │   ├── main/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── SplashScreen.tsx
│   ├── services/
│   │   ├── AuthService.ts         # Authentication logic
│   │   ├── DeviceService.ts       # Device fingerprinting
│   │   └── StorageService.ts      # AsyncStorage wrapper
│   ├── store/
│   │   ├── AuthContext.tsx        # Auth state management
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   ├── utils/
│   │   ├── deviceFingerprint.ts   # Device identification
│   │   └── validation.ts          # Input validation
│   └── App.tsx
├── .env
├── .env.example
├── android/
├── ios/
└── package.json
```

#### Day 3: Core Services Implementation

**File:** `src/config/environment.ts`

```typescript
import Config from 'react-native-dotenv';

interface EnvironmentConfig {
  API_BASE_URL: string;
  API_VERSION: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

export const ENV: EnvironmentConfig = {
  API_BASE_URL: Config.API_BASE_URL || 'http://localhost:3000',
  API_VERSION: 'v1',
  ENVIRONMENT: (Config.ENVIRONMENT as any) || 'development',
};

export const API_URL = `${ENV.API_BASE_URL}/api/${ENV.API_VERSION}`;
```

**File:** `src/api/client.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_URL } from '@/config/environment';
import StorageService from '@/services/StorageService';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await StorageService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add device ID header
        const deviceId = await StorageService.getDeviceId();
        if (deviceId) {
          config.headers['X-Device-ID'] = deviceId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry original request
            return this.client.request(error.config!);
          } else {
            // Logout user
            await StorageService.clearAuth();
            // Navigate to login (handled by auth context)
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      if (!refreshToken) return false;

      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      await StorageService.setAccessToken(response.data.accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export default new APIClient();
```

**File:** `src/services/StorageService.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@etally:accessToken',
  REFRESH_TOKEN: '@etally:refreshToken',
  DEVICE_ID: '@etally:deviceId',
  USER_DATA: '@etally:userData',
  DEVICE_FINGERPRINT: '@etally:deviceFingerprint',
};

class StorageService {
  // Auth tokens
  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token);
  }

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  // Device ID
  async setDeviceId(deviceId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.DEVICE_ID, deviceId);
  }

  async getDeviceId(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.DEVICE_ID);
  }

  // Device Fingerprint
  async setDeviceFingerprint(fingerprint: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.DEVICE_FINGERPRINT, fingerprint);
  }

  async getDeviceFingerprint(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.DEVICE_FINGERPRINT);
  }

  // User data
  async setUserData(user: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
  }

  async getUserData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  // Clear all auth data
  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.USER_DATA,
    ]);
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  }
}

export default new StorageService();
```

**File:** `src/utils/deviceFingerprint.ts`

```typescript
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import { sha256 } from 'react-native-sha256';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import StorageService from '@/services/StorageService';

export interface DeviceInfo {
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  platform: 'android' | 'ios';
  appVersion: string;
  imeiNumber?: string;
  deviceFingerprint: string;
  deviceName?: string;
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  // Get or create persistent device ID
  let deviceId = await StorageService.getDeviceId();
  if (!deviceId) {
    deviceId = uuidv4();
    await StorageService.setDeviceId(deviceId);
  }

  const deviceModel = DeviceInfo.getModel();
  const osVersion = DeviceInfo.getSystemVersion();
  const platform = Platform.OS as 'android' | 'ios';
  const appVersion = DeviceInfo.getVersion();

  // Try to get IMEI (Android only, requires permissions)
  let imeiNumber: string | undefined;
  if (Platform.OS === 'android') {
    try {
      // Note: This requires READ_PHONE_STATE permission
      // const imei = await DeviceInfo.getImei();
      // imeiNumber = imei;
      // For now, we skip IMEI as it's optional
    } catch (error) {
      console.log('Could not get IMEI:', error);
    }
  }

  // Generate device fingerprint
  const fingerprint = await generateDeviceFingerprint({
    deviceId,
    deviceModel,
    osVersion,
    platform,
  });

  return {
    deviceId,
    deviceModel,
    osVersion,
    platform,
    appVersion,
    imeiNumber,
    deviceFingerprint: fingerprint,
  };
}

async function generateDeviceFingerprint(data: {
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  platform: string;
}): Promise<string> {
  // Check if we already have a fingerprint
  let fingerprint = await StorageService.getDeviceFingerprint();

  if (fingerprint) {
    return fingerprint;
  }

  // Generate new fingerprint from device characteristics
  const fingerprintData = [
    data.platform,
    data.osVersion,
    data.deviceModel,
    data.deviceId,
  ].join('|');

  fingerprint = await sha256(fingerprintData);

  // Store for future use
  await StorageService.setDeviceFingerprint(fingerprint);

  return fingerprint;
}
```

**Deliverables:**

- ✅ React Native project initialized with TypeScript
- ✅ Core dependencies installed
- ✅ Project structure created
- ✅ API client configured
- ✅ Storage service implemented
- ✅ Device fingerprinting implemented

---

## 📱 STAGE 2: Implement Mobile Registration

**Duration:** 4 days  
**Goal:** Complete registration flow UI and logic

### Day 4-5: Registration Screens

**File:** `src/screens/auth/PhoneInputScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import APIClient from '@/api/client';

export default function PhoneInputScreen() {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhone = (phone: string): boolean => {
    // Kenyan phone format: 7XX XXX XXX or 1XX XXX XXX
    return /^[17]\d{8}$/.test(phone);
  };

  const handleSendOTP = async () => {
    if (!validatePhone(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number');
      return;
    }

    setLoading(true);
    try {
      await APIClient.post('/auth/register/initiate', {
        phoneNumber: `+254${phoneNumber}`,
      });

      // Navigate to OTP screen
      navigation.navigate('OTPVerification', {
        phoneNumber: `+254${phoneNumber}`,
      });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register for eTally</Text>
      <Text style={styles.subtitle}>
        Enter your mobile number to get started
      </Text>

      <View style={styles.phoneInputContainer}>
        <Text style={styles.countryCode}>+254</Text>
        <TextInput
          style={styles.phoneInput}
          placeholder="712345678"
          keyboardType="phone-pad"
          maxLength={9}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading || !validatePhone(phoneNumber)}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

Continue in next response...

---

## ⚙️ STAGE 3: Backend Phase 1 - Schema & OTP System

**Duration:** 3 days

Will be provided after Stage 2 is complete.

---

## 🗄️ STAGE 4: Backend Phase 1 - Prisma Migrations

**Duration:** 2 days

Will be provided after Stage 3 is complete.

---

## 📧 STAGE 5: Backend Phase 1 - SMS Service Integration

**Duration:** 2 days

Will be provided after Stage 4 is complete.

---

## ✅ STAGE 6: Complete Registration Flow Testing

**Duration:** 3 days

Will be provided after Stage 5 is complete.

---

## 🎯 Success Criteria

Each stage must meet these criteria before moving to the next:

**Stage 1:**

- [ ] Mobile app runs on both iOS and Android
- [ ] API client successfully connects to backend
- [ ] Storage service persists data
- [ ] Device fingerprinting generates unique hash

**Stage 2:**

- [ ] All registration screens functional
- [ ] Phone validation works correctly
- [ ] OTP input has good UX
- [ ] Device info is captured

**Stage 3:**

- [ ] Schema updated with all required models
- [ ] OTP generation and verification working
- [ ] Rate limiting implemented

**Stage 4:**

- [ ] Migrations run successfully
- [ ] No data loss in existing tables
- [ ] Indexes created properly

**Stage 5:**

- [ ] SMS sends successfully via Africa's Talking
- [ ] OTP SMS delivered within 5 seconds
- [ ] Bulk SMS capability working

**Stage 6:**

- [ ] End-to-end registration flow works
- [ ] Device registration successful
- [ ] Status updates correctly

---

## 📞 Ready to Begin?

**Next Action:** Execute Stage 1 - Set Up Mobile Framework

Would you like me to:

1. **Start Stage 1 now** - Set up the mobile framework
2. **Create the React Native project** with all configurations
3. **Something else?**

Let me know and we'll proceed step by step! 🚀
