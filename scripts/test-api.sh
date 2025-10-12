#!/bin/bash

# ==========================================
# Election Management System
# API Testing Script
# ==========================================

set -e

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   Election Management System - API Tests           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: jq not installed. Install for better output formatting.${NC}"
    JQ_CMD="cat"
else
    JQ_CMD="jq ."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "Health check"
    curl -s $BASE_URL/health | $JQ_CMD
else
    test_result 1 "Health check (Got $RESPONSE)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: User Registration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate random email to avoid conflicts
RANDOM_EMAIL="test$(date +%s)@example.com"
RANDOM_ID="$(date +%s | tail -c 9)"

REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d "{
    \"nationalId\": \"$RANDOM_ID\",
    \"email\": \"$RANDOM_EMAIL\",
    \"phoneNumber\": \"+254712345678\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"password\": \"Test123!@#\"
  }")

if echo $REGISTER_RESPONSE | grep -q "User registered successfully"; then
    test_result 0 "User registration"
    
    # Extract tokens
    ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | $JQ_CMD | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | $JQ_CMD | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    
    echo "Email: $RANDOM_EMAIL"
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
else
    test_result 1 "User registration"
    echo $REGISTER_RESPONSE | $JQ_CMD
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: User Login"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"admin@elections.ke\",
    \"password\": \"Admin123!@#\"
  }")

if echo $LOGIN_RESPONSE | grep -q "Login successful"; then
    test_result 0 "User login"
    
    # Extract tokens for subsequent tests
    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.accessToken' 2>/dev/null || echo "")
    REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.refreshToken' 2>/dev/null || echo "")
    
    echo "Logged in as: admin@elections.ke"
else
    test_result 1 "User login"
    echo $LOGIN_RESPONSE | $JQ_CMD
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Get User Profile (Protected Route)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$ACCESS_TOKEN" ]; then
    PROFILE_RESPONSE=$(curl -s $BASE_URL/api/v1/auth/profile \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo $PROFILE_RESPONSE | grep -q "Profile retrieved successfully"; then
        test_result 0 "Get profile with JWT"
        echo $PROFILE_RESPONSE | $JQ_CMD | grep -E '"(email|firstName|lastName|role)"'
    else
        test_result 1 "Get profile with JWT"
        echo $PROFILE_RESPONSE | $JQ_CMD
    fi
else
    test_result 1 "Get profile (No access token available)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Refresh Access Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$REFRESH_TOKEN" ]; then
    REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/refresh \
      -H 'Content-Type: application/json' \
      -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
    
    if echo $REFRESH_RESPONSE | grep -q "Token refreshed successfully"; then
        test_result 0 "Refresh access token"
        NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.data.accessToken' 2>/dev/null || echo "")
        echo "New access token: ${NEW_ACCESS_TOKEN:0:50}..."
    else
        test_result 1 "Refresh access token"
        echo $REFRESH_RESPONSE | $JQ_CMD
    fi
else
    test_result 1 "Refresh token (No refresh token available)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Invalid Credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INVALID_LOGIN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@elections.ke",
    "password": "WrongPassword123!@"
  }')

if echo $INVALID_LOGIN | grep -q "Invalid email or password"; then
    test_result 0 "Invalid credentials rejected"
else
    test_result 1 "Invalid credentials handling"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: Missing Authorization Header"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NO_AUTH_RESPONSE=$(curl -s $BASE_URL/api/v1/auth/profile)

if echo $NO_AUTH_RESPONSE | grep -q "No authorization token provided"; then
    test_result 0 "Missing auth header rejected"
else
    test_result 1 "Missing auth header handling"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 8: Duplicate Email Registration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DUPLICATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "nationalId": "88888888",
    "email": "admin@elections.ke",
    "firstName": "Duplicate",
    "lastName": "User",
    "password": "Test123!@#"
  }')

if echo $DUPLICATE_RESPONSE | grep -q "already registered"; then
    test_result 0 "Duplicate email rejected"
else
    test_result 1 "Duplicate email handling"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 9: Invalid National ID Format"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INVALID_ID=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "nationalId": "abc123",
    "email": "invalid@test.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "Test123!@#"
  }')

if echo $INVALID_ID | grep -q "7 or 8 digits"; then
    test_result 0 "Invalid national ID rejected"
else
    test_result 1 "Invalid national ID handling"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 10: Invalid Phone Number Format"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INVALID_PHONE=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "nationalId": "77777777",
    "email": "phone@test.com",
    "phoneNumber": "0712345678",
    "firstName": "Test",
    "lastName": "User",
    "password": "Test123!@#"
  }')

if echo $INVALID_PHONE | grep -q "valid Kenyan number"; then
    test_result 0 "Invalid phone number rejected"
else
    test_result 1 "Invalid phone number handling"
fi
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "All critical authentication tests completed!"
echo ""
echo "Next steps:"
echo "1. Import postman_collection.json into Postman"
echo "2. Check POSTMAN_EXAMPLES.md for detailed examples"
echo "3. Test manually in Postman UI"
echo ""
