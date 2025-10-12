# Postman Testing Examples

## Election Management System - API Endpoints

**Base URL:** `http://localhost:3000`

---

## 📋 Table of Contents

1. [Health & System](#1-health--system)
2. [Authentication](#2-authentication)
3. [User Management](#3-user-management)
4. [Common Headers](#common-headers)
5. [Error Responses](#error-responses)

---

## 1. Health & System

### 1.1 Health Check

**Request:**

```bash
curl --location 'http://localhost:3000/health'
```

**Expected Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2025-10-08T12:26:03.061Z",
  "uptime": 10.315994459,
  "environment": "development"
}
```

### 1.2 API Info

**Request:**

```bash
curl --location 'http://localhost:3000/api'
```

**Expected Response (200):**

```json
{
  "name": "Election Management System API",
  "version": "1.0.0",
  "documentation": "/api-docs"
}
```

---

## 2. Authentication

### 2.1 Register New User

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
  "nationalId": "12345678",
  "email": "john.doe@example.com",
  "phoneNumber": "+254712345678",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!@"
}'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "323cba89-10ca-47c6-b257-d9581ef81eec",
      "nationalId": "12345678",
      "email": "john.doe@example.com",
      "phoneNumber": "+254712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "field_observer",
      "isActive": true,
      "lastLogin": null,
      "createdAt": "2025-10-08T12:26:32.462Z",
      "updatedAt": "2025-10-08T12:26:32.462Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "94c60ab4c58a45c588d0d0f61e8c3ede..."
    }
  }
}
```

### 2.2 Login

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "john.doe@example.com",
  "password": "SecurePass123!@",
  "deviceInfo": {
    "deviceName": "Johns MacBook Pro",
    "deviceModel": "MacBook Pro M1",
    "osVersion": "macOS 14.0",
    "appVersion": "1.0.0"
  }
}'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "323cba89-10ca-47c6-b257-d9581ef81eec",
      "nationalId": "12345678",
      "email": "john.doe@example.com",
      "phoneNumber": "+254712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "field_observer",
      "isActive": true,
      "lastLogin": "2025-10-08T12:30:00.000Z",
      "createdAt": "2025-10-08T12:26:32.462Z",
      "updatedAt": "2025-10-08T12:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "db41ad32896ce6159a3f5facc7c08d69..."
    }
  }
}
```

**💡 TIP:** Save the `accessToken` from the response - you'll need it for protected endpoints!

### 2.3 Get Current User Profile

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/profile' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "323cba89-10ca-47c6-b257-d9581ef81eec",
    "nationalId": "12345678",
    "email": "john.doe@example.com",
    "phoneNumber": "+254712345678",
    "firstName": "John",
    "lastName": "Doe",
    "role": "field_observer",
    "isActive": true,
    "lastLogin": "2025-10-08T12:30:00.000Z",
    "createdAt": "2025-10-08T12:26:32.462Z",
    "updatedAt": "2025-10-08T12:30:00.000Z"
  }
}
```

### 2.4 Refresh Access Token

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/refresh' \
--header 'Content-Type: application/json' \
--data-raw '{
  "refreshToken": "db41ad32896ce6159a3f5facc7c08d69..."
}'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.5 Change Password

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/change-password' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' \
--header 'Content-Type: application/json' \
--data-raw '{
  "currentPassword": "SecurePass123!@",
  "newPassword": "NewSecurePass456!@"
}'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully. Please login again with your new password."
}
```

### 2.6 Logout

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/logout' \
--header 'Content-Type: application/json' \
--data-raw '{
  "refreshToken": "db41ad32896ce6159a3f5facc7c08d69..."
}'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 3. User Management

### 3.1 Register Admin User

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
  "nationalId": "87654321",
  "email": "admin@elections.ke",
  "phoneNumber": "+254798765432",
  "firstName": "System",
  "lastName": "Administrator",
  "password": "Admin123!@#$"
}'
```

### 3.2 Register Field Observer

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
  "nationalId": "11223344",
  "email": "observer@elections.ke",
  "phoneNumber": "+254700123456",
  "firstName": "Field",
  "lastName": "Observer",
  "password": "Observer123!@"
}'
```

### 3.3 Register Multiple Test Users (Bash Script)

**Script:**

```bash
#!/bin/bash

# Array of test users
declare -a users=(
  '{"nationalId":"10000001","email":"user1@test.com","firstName":"User","lastName":"One","password":"Test123!@"}'
  '{"nationalId":"10000002","email":"user2@test.com","firstName":"User","lastName":"Two","password":"Test123!@"}'
  '{"nationalId":"10000003","email":"user3@test.com","firstName":"User","lastName":"Three","password":"Test123!@"}'
)

# Register each user
for user in "${users[@]}"
do
  curl -X POST http://localhost:3000/api/v1/auth/register \
    -H 'Content-Type: application/json' \
    -d "$user"
  echo ""
done
```

---

## Common Headers

### For Public Endpoints (No Auth Required)

```
Content-Type: application/json
```

### For Protected Endpoints (Auth Required)

```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

### Optional Headers (For Audit Trail)

```
X-Device-ID: device-unique-id
X-Request-ID: unique-request-id
X-Correlation-ID: correlation-id-for-tracing
```

---

## Error Responses

### 400 - Validation Error

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "invalid-email",
  "password": "weak"
}'
```

**Response:**

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed: Invalid email format, Password must be at least 8 characters",
  "statusCode": 400,
  "timestamp": "2025-10-08T12:30:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### 401 - Authentication Error

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "test@example.com",
  "password": "wrongpassword"
}'
```

**Response:**

```json
{
  "success": false,
  "error": "AuthenticationError",
  "message": "Invalid email or password",
  "statusCode": 401,
  "timestamp": "2025-10-08T12:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

### 401 - Missing Token

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/profile'
```

**Response:**

```json
{
  "success": false,
  "error": "AuthenticationError",
  "message": "No authorization token provided",
  "statusCode": 401,
  "timestamp": "2025-10-08T12:30:00.000Z",
  "path": "/api/v1/auth/profile"
}
```

### 409 - Conflict Error

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
  "nationalId": "12345678",
  "email": "existing@example.com",
  "firstName": "Test",
  "lastName": "User",
  "password": "Test123!@"
}'
```

**Response:**

```json
{
  "success": false,
  "error": "ConflictError",
  "message": "Email already registered",
  "statusCode": 409,
  "timestamp": "2025-10-08T12:30:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### 404 - Not Found

**Request:**

```bash
curl --location 'http://localhost:3000/api/v1/nonexistent'
```

**Response:**

```json
{
  "success": false,
  "error": "NotFound",
  "message": "Cannot GET /api/v1/nonexistent",
  "statusCode": 404,
  "timestamp": "2025-10-08T12:30:00.000Z",
  "path": "/api/v1/nonexistent"
}
```

---

## 🚀 Postman Collection Format

You can import these as a Postman Collection. Here's the JSON format:

```json
{
  "info": {
    "name": "Election Management System",
    "description": "API endpoints for eTally system",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "accessToken",
      "value": "",
      "type": "string"
    },
    {
      "key": "refreshToken",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Register User",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 201) {",
              "    const response = pm.response.json();",
              "    pm.collectionVariables.set('accessToken', response.data.tokens.accessToken);",
              "    pm.collectionVariables.set('refreshToken', response.data.tokens.refreshToken);",
              "}"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"nationalId\": \"12345678\",\n  \"email\": \"test@example.com\",\n  \"phoneNumber\": \"+254712345678\",\n  \"firstName\": \"Test\",\n  \"lastName\": \"User\",\n  \"password\": \"Test123!@#\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/auth/register",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "auth", "register"]
        }
      }
    },
    {
      "name": "Login",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const response = pm.response.json();",
              "    pm.collectionVariables.set('accessToken', response.data.tokens.accessToken);",
              "    pm.collectionVariables.set('refreshToken', response.data.tokens.refreshToken);",
              "}"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Test123!@#\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "auth", "login"]
        }
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/auth/profile",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "auth", "profile"]
        }
      }
    },
    {
      "name": "Refresh Token",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const response = pm.response.json();",
              "    pm.collectionVariables.set('accessToken', response.data.accessToken);",
              "}"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/auth/refresh",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "auth", "refresh"]
        }
      }
    },
    {
      "name": "Change Password",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"currentPassword\": \"Test123!@#\",\n  \"newPassword\": \"NewPass123!@#\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/auth/change-password",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "auth", "change-password"]
        }
      }
    },
    {
      "name": "Logout",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/auth/logout",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "auth", "logout"]
        }
      }
    }
  ]
}
```

---

## 📥 How to Import into Postman

### Method 1: Import JSON Collection

1. **Save the JSON above** to a file named `etally-collection.json`
2. **Open Postman** → Click "Import" button
3. **Select the file** or drag and drop
4. **Collection imported!** You'll see "Election Management System" in your collections

### Method 2: Manual Setup

1. **Create New Collection** in Postman
2. **Add Collection Variables:**
   - `baseUrl` = `http://localhost:3000`
   - `accessToken` = (leave empty, auto-populated on login)
   - `refreshToken` = (leave empty, auto-populated on login)
3. **Copy each curl command** and paste into Postman
4. **Postman will auto-convert** curl to request format

### Method 3: Use Postman Scripts

Add to each login/register request's **Tests** tab:

```javascript
// Auto-save tokens to collection variables
if (pm.response.code === 200 || pm.response.code === 201) {
  const response = pm.response.json();
  if (response.data && response.data.tokens) {
    pm.collectionVariables.set('accessToken', response.data.tokens.accessToken);
    pm.collectionVariables.set(
      'refreshToken',
      response.data.tokens.refreshToken
    );
    console.log('✓ Tokens saved to collection variables');
  }
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete User Journey

```bash
# 1. Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nationalId":"99887766","email":"journey@test.com","firstName":"Test","lastName":"Journey","password":"Test123!@"}'

# 2. Login (save tokens from response)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"journey@test.com","password":"Test123!@"}'

# 3. Get Profile (replace TOKEN)
TOKEN="your_access_token_here"
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# 4. Change Password
curl -X PUT http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"currentPassword":"Test123!@","newPassword":"NewTest123!@"}'

# 5. Login with new password
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"journey@test.com","password":"NewTest123!@"}'

# 6. Logout (use refreshToken from login)
REFRESH_TOKEN="your_refresh_token_here"
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

### Scenario 2: Failed Login Attempts

```bash
# Try 5 wrong passwords to trigger account lockout
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"WrongPass'$i'!@"}'
  echo ""
done

# 6th attempt should return "Account is temporarily locked"
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"WrongPass6!@"}'
```

### Scenario 3: Token Refresh Flow

```bash
# 1. Login
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test123!@"}')

# Extract tokens
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.data.tokens.refreshToken')

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"

# 2. Use access token (valid for 15 minutes)
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. After 15 minutes, refresh the token
NEW_ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq -r '.data.accessToken')

echo "New Access Token: $NEW_ACCESS"

# 4. Use new access token
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $NEW_ACCESS"
```

---

## 🔒 Security Testing

### Test 1: SQL Injection Prevention

```bash
# Attempt SQL injection in email field
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com OR 1=1--","password":"anything"}'

# Should return validation error, not SQL error
```

### Test 2: XSS Prevention

```bash
# Attempt XSS in firstName
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nationalId":"12345678","email":"xss@test.com","firstName":"<script>alert(\"xss\")</script>","lastName":"Test","password":"Test123!@"}'

# Should return validation error for invalid characters
```

### Test 3: Password Requirements

```bash
# Weak password (should fail)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nationalId":"12345678","email":"weak@test.com","firstName":"Test","lastName":"User","password":"weak"}'

# Should return: Password must be at least 8 characters
```

---

## 💡 Postman Tips

### 1. Environment Variables

Create a Postman Environment with:

- `baseUrl` = `http://localhost:3000`
- `accessToken` = (auto-populated)
- `refreshToken` = (auto-populated)

### 2. Pre-request Script (Auto-login)

Add to collection's Pre-request Scripts:

```javascript
// Auto-login if no token exists
if (!pm.collectionVariables.get('accessToken')) {
  pm.sendRequest(
    {
      url: pm.variables.get('baseUrl') + '/api/v1/auth/login',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          email: 'admin@elections.ke',
          password: 'Admin123!@#',
        }),
      },
    },
    (err, response) => {
      if (!err && response.code === 200) {
        const data = response.json();
        pm.collectionVariables.set('accessToken', data.data.tokens.accessToken);
        pm.collectionVariables.set(
          'refreshToken',
          data.data.tokens.refreshToken
        );
      }
    }
  );
}
```

### 3. Test Scripts (Assertions)

Add to request Tests tab:

```javascript
// Test status code
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});

// Test response structure
pm.test('Response has success field', function () {
  pm.response.to.have.jsonBody('success');
});

// Test response time
pm.test('Response time is less than 500ms', function () {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

// Save tokens automatically
if (pm.response.json().data && pm.response.json().data.tokens) {
  pm.collectionVariables.set(
    'accessToken',
    pm.response.json().data.tokens.accessToken
  );
  pm.collectionVariables.set(
    'refreshToken',
    pm.response.json().data.tokens.refreshToken
  );
}
```

---

## 📝 Validation Rules Reference

### Email

- Must be valid email format
- Must be unique

### National ID

- Must be 7 or 8 digits
- Must be unique

### Phone Number

- Must be Kenyan format: `+254XXXXXXXXX`
- Optional field

### Password

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character: `!@#$%^&*(),.?":{}|<>`

### Names (First/Last)

- Minimum 2 characters
- Maximum 100 characters
- Only letters, spaces, hyphens, apostrophes

---

## 🎯 Quick Test Commands

### Test All Auth Endpoints

```bash
#!/bin/bash

echo "=== Testing Election Management System API ==="
echo ""

# 1. Health Check
echo "1. Health Check..."
curl -s http://localhost:3000/health | jq .
echo ""

# 2. Register
echo "2. Register User..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "nationalId": "99999999",
    "email": "quicktest@test.com",
    "phoneNumber": "+254799999999",
    "firstName": "Quick",
    "lastName": "Test",
    "password": "QuickTest123!@"
  }')

echo $REGISTER_RESPONSE | jq .
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.tokens.refreshToken')
echo ""

# 3. Get Profile
echo "3. Get Profile..."
curl -s http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
echo ""

# 4. Refresh Token
echo "4. Refresh Token..."
curl -s -X POST http://localhost:3000/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
echo ""

# 5. Logout
echo "5. Logout..."
curl -s -X POST http://localhost:3000/api/v1/auth/logout \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
echo ""

echo "=== All Tests Complete ==="
```

Save this as `test-api.sh`, make it executable (`chmod +x test-api.sh`), and run it!

---

## 📞 Support

**Issues?**

- Check server is running: `curl http://localhost:3000/health`
- Check Docker services: `docker-compose ps`
- View server logs: Check terminal where backend is running
- View database: http://localhost:5050 (pgAdmin)

**Documentation:**

- API Docs: [backend/src/domains/auth/README.md](backend/src/domains/auth/README.md)
- Quick Start: [backend/QUICKSTART.md](backend/QUICKSTART.md)
- Status: [STATUS.md](STATUS.md)

---

**✨ Happy Testing!**
