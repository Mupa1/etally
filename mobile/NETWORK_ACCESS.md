# Accessing Field Observer PWA on Local Network (WiFi)

## 🎯 Goal

Access the PWA from your mobile phone or other devices on the same WiFi network for testing.

## 📍 Your Local IP Address

**`192.168.178.72`**

---

## ⚡ Quick Setup (2 options)

### Option 1: Using Docker (Production Mode) ✅ Recommended

#### Step 1: Update CORS Settings

Create or update `/Users/mupa/Documents/work/etally2/.env` file:

```bash
# Add this line (or update existing CORS_ORIGIN)
CORS_ORIGIN=http://localhost,http://localhost:80,http://localhost:5173,http://192.168.178.72,http://192.168.178.72:80,http://192.168.178.72:5173
```

#### Step 2: Restart API Container

```bash
cd /Users/mupa/Documents/work/etally2
docker compose up -d api
```

#### Step 3: Access from Mobile Device

On your phone or tablet (connected to same WiFi):

**Frontend (PWA)**:

```
http://192.168.178.72
```

**Specific Mobile Routes**:

- Registration: `http://192.168.178.72/mobile/register`
- Login: `http://192.168.178.72/mobile/login`
- Track: `http://192.168.178.72/mobile/track`

**Backend API**:

```
http://192.168.178.72:3000
```

---

### Option 2: Using Development Mode (Easier for Testing)

#### Step 1: Run Frontend with Network Access

```bash
cd /Users/mupa/Documents/work/etally2/frontend
npm run dev -- --host 0.0.0.0
```

This will show:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.178.72:5173/
```

#### Step 2: Update Frontend API URL

In `/frontend/src/utils/api.ts`, ensure it uses your IP:

```typescript
const API_URL =
  import.meta.env.VITE_API_URL || 'http://192.168.178.72:3000/api/v1';
```

Or set in `/frontend/.env`:

```bash
VITE_API_URL=http://192.168.178.72:3000/api/v1
```

#### Step 3: Access from Mobile

On your phone:

```
http://192.168.178.72:5173/mobile/register
```

---

## 🔧 Complete Configuration

### Update `.env` File

Create `/Users/mupa/Documents/work/etally2/.env` with:

```bash
# Database
DB_PASSWORD=rPikWsN28QK8lBHcLAr6IYxj1JAQikj5

# Redis
REDIS_PASSWORD=<from secrets/redis_password.txt>

# MinIO
MINIO_PASSWORD=<from secrets/minio_password.txt>

# JWT
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-jwt-refresh-secret>

# CORS (IMPORTANT for network access)
CORS_ORIGIN=http://localhost,http://localhost:80,http://localhost:5173,http://192.168.178.72,http://192.168.178.72:80,http://192.168.178.72:5173,http://192.168.178.72:3000

# Email (optional for now)
EMAIL_FROM=noreply@etally.com
APP_URL=http://192.168.178.72
```

### Restart Services

```bash
cd /Users/mupa/Documents/work/etally2
docker compose down
docker compose up -d
```

---

## 🧪 Test Network Access

### From Your Computer

```bash
# Test backend
curl http://192.168.178.72:3000/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}
```

### From Your Mobile Device

1. **Connect to same WiFi** as your computer

2. **Open browser** on phone

3. **Navigate to**: `http://192.168.178.72/mobile/register`

4. **Test registration form**:
   - Fill out personal info
   - Take photos using phone camera
   - Upload documents
   - Submit

---

## 📱 Installing PWA on Mobile

Once you access the URL on your phone:

### iOS (Safari)

1. Open `http://192.168.178.72/mobile/register` in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "Election Observer"
5. Tap **Add**
6. The PWA will appear as an app icon on your home screen

### Android (Chrome)

1. Open `http://192.168.178.72/mobile/register` in Chrome
2. Tap the **menu** (three dots)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Confirm the installation
5. The PWA will appear as an app on your home screen

---

## 🔒 Firewall Configuration (if needed)

If you can't access from mobile, check firewall:

### macOS Firewall

```bash
# Allow incoming connections on ports 80, 3000, 5173
# System Preferences > Security & Privacy > Firewall > Firewall Options
# Allow: Node, Docker, or add specific ports
```

### Quick Test

From your phone's browser, try:

```
http://192.168.178.72:3000/health
```

If this works, backend is accessible. If not, check firewall.

---

## 🌐 URLs to Access on Mobile

| Service                   | URL                                     | Purpose            |
| ------------------------- | --------------------------------------- | ------------------ |
| **Frontend (Docker)**     | `http://192.168.178.72`                 | Main PWA           |
| **Frontend (Dev)**        | `http://192.168.178.72:5173`            | Development mode   |
| **Backend API**           | `http://192.168.178.72:3000`            | API endpoints      |
| **Observer Registration** | `http://192.168.178.72/mobile/register` | Start here!        |
| **Observer Login**        | `http://192.168.178.72/mobile/login`    | Login page         |
| **MinIO Console**         | `http://192.168.178.72:9001`            | File storage admin |
| **Grafana**               | `http://192.168.178.72:3001`            | Monitoring         |

---

## 🐛 Troubleshooting

### Cannot Access from Mobile

**Problem**: Connection refused or timeout

**Solutions**:

1. Check firewall settings on Mac
2. Verify both devices on same WiFi
3. Ping test from computer:
   ```bash
   ping 192.168.178.72
   ```
4. Check Docker containers are running:
   ```bash
   docker ps
   ```

### CORS Errors

**Problem**: API calls blocked by CORS

**Solution**: Make sure CORS_ORIGIN includes your IP:

```bash
CORS_ORIGIN=http://192.168.178.72,http://192.168.178.72:80
```

Then restart:

```bash
docker compose restart api
```

### Cannot Take Photos

**Problem**: Camera not working in browser

**Solution**:

- Use HTTPS (required for camera on iOS)
- Or use Chrome/Safari's "file picker" instead
- In production, you'll need SSL certificate

---

## 🔐 For Production (HTTPS Required)

For real deployment with camera access on iOS:

1. Get SSL certificate (Let's Encrypt)
2. Configure nginx with HTTPS
3. Access via `https://your-domain.com`

For now, on **Android Chrome**, camera works on HTTP.
On **iOS Safari**, you'll need HTTPS or use file picker.

---

## ✅ Quick Checklist

- [ ] Found your local IP: `192.168.178.72`
- [ ] Updated CORS_ORIGIN in .env
- [ ] Restarted Docker containers
- [ ] Tested backend: `http://192.168.178.72:3000/health`
- [ ] Connected phone to same WiFi
- [ ] Opened PWA: `http://192.168.178.72/mobile/register`
- [ ] Tested registration form on mobile
- [ ] Installed PWA to home screen (optional)

---

**Start here on your phone**: `http://192.168.178.72/mobile/register` 📱
