# Observer Admin API Documentation

This document describes the REST API endpoints for observer management and analytics.

## Base URL

```
/api/v1/admin/observers
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Authorization

- **Super Admin**: Full access to all endpoints
- **Election Manager**: Read access to most endpoints, limited update access

## Endpoints Overview

| Method | Endpoint       | Description                   | Access Level                  |
| ------ | -------------- | ----------------------------- | ----------------------------- |
| GET    | `/`            | List observers with filtering | Super Admin, Election Manager |
| GET    | `/stats`       | Get observer statistics       | Super Admin, Election Manager |
| GET    | `/analytics`   | Get observer analytics        | Super Admin, Election Manager |
| GET    | `/dashboard`   | Get dashboard data            | Super Admin, Election Manager |
| GET    | `/export`      | Export observers to CSV       | Super Admin, Election Manager |
| GET    | `/:id`         | Get observer by ID            | Super Admin, Election Manager |
| PUT    | `/:id`         | Update observer               | Super Admin, Election Manager |
| DELETE | `/:id`         | Delete observer (soft delete) | Super Admin only              |
| POST   | `/bulk-update` | Bulk update observer status   | Super Admin, Election Manager |

---

## 1. List Observers

**GET** `/api/v1/admin/observers`

Get a paginated list of observers with filtering and sorting options.

### Query Parameters

| Parameter            | Type   | Required | Default   | Description                                                 |
| -------------------- | ------ | -------- | --------- | ----------------------------------------------------------- |
| `status`             | string | No       | -         | Filter by observer status                                   |
| `location`           | string | No       | -         | Filter by location (county/constituency/ward)               |
| `registrationStatus` | string | No       | -         | Filter by registration status                               |
| `search`             | string | No       | -         | Search by name, email, tracking number                      |
| `page`               | number | No       | 1         | Page number (1-based)                                       |
| `limit`              | number | No       | 10        | Items per page (1-100)                                      |
| `sortBy`             | string | No       | createdAt | Sort field (name, email, status, submissionDate, createdAt) |
| `sortOrder`          | string | No       | desc      | Sort order (asc, desc)                                      |

### Valid Status Values

- `pending_review`
- `approved`
- `active`
- `rejected`
- `suspended`
- `inactive`

### Example Request

```bash
GET /api/v1/admin/observers?status=approved&search=john&page=1&limit=20&sortBy=name&sortOrder=asc
```

### Response

```json
{
  "success": true,
  "message": "Observers retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "trackingNumber": "OBS001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+254712345678",
      "nationalId": "12345678",
      "status": "approved",
      "submissionDate": "2024-01-15T10:30:00Z",
      "reviewDate": "2024-01-16T14:20:00Z",
      "preferredCounty": {
        "id": "uuid",
        "name": "Nairobi"
      },
      "preferredConstituency": {
        "id": "uuid",
        "name": "Westlands"
      },
      "reviewer": {
        "id": "uuid",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "user": {
        "id": "uuid",
        "isActive": true,
        "lastLogin": "2024-01-20T09:15:00Z"
      },
      "assignments": [
        {
          "id": "uuid",
          "pollingStation": {
            "id": "uuid",
            "name": "Westlands Primary School",
            "constituency": {
              "name": "Westlands"
            }
          },
          "assignmentDate": "2024-01-17T10:00:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 2. Get Observer Statistics

**GET** `/api/v1/admin/observers/stats`

Get comprehensive statistics about observers.

### Response

```json
{
  "success": true,
  "message": "Observer statistics retrieved successfully",
  "data": {
    "total": 150,
    "active": 120,
    "pending": 15,
    "approved": 130,
    "rejected": 5,
    "suspended": 3,
    "inactive": 12,
    "assigned": 100,
    "unassigned": 50,
    "recentRegistrations": 25,
    "recentApprovals": 20
  }
}
```

---

## 3. Get Observer Analytics

**GET** `/api/v1/admin/observers/analytics`

Get detailed analytics and trends for observers.

### Query Parameters

| Parameter | Type   | Required | Default | Description                          |
| --------- | ------ | -------- | ------- | ------------------------------------ |
| `days`    | number | No       | 30      | Number of days for analytics (1-365) |

### Example Request

```bash
GET /api/v1/admin/observers/analytics?days=7
```

### Response

```json
{
  "success": true,
  "message": "Observer analytics retrieved successfully",
  "data": {
    "registrationTrends": [
      {
        "date": "2024-01-15",
        "count": 5
      },
      {
        "date": "2024-01-16",
        "count": 8
      }
    ],
    "statusDistribution": [
      {
        "status": "approved",
        "count": 130,
        "percentage": 86.7
      },
      {
        "status": "pending_review",
        "count": 15,
        "percentage": 10.0
      }
    ],
    "locationDistribution": [
      {
        "location": "Nairobi",
        "count": 45,
        "percentage": 30.0
      },
      {
        "location": "Mombasa",
        "count": 30,
        "percentage": 20.0
      }
    ],
    "approvalRates": [
      {
        "period": "2024-01-15T00:00:00Z",
        "approvalRate": 85.7,
        "totalApplications": 7,
        "approvedApplications": 6
      }
    ],
    "activityMetrics": {
      "totalObservers": 150,
      "activeObservers": 120,
      "averageResponseTime": 24,
      "completionRate": 80.0
    }
  }
}
```

---

## 4. Get Observer Dashboard

**GET** `/api/v1/admin/observers/dashboard`

Get combined dashboard data including stats, recent observers, and analytics.

### Response

```json
{
  "success": true,
  "message": "Observer dashboard data retrieved successfully",
  "data": {
    "stats": {
      "total": 150,
      "active": 120,
      "pending": 15,
      "approved": 130,
      "rejected": 5,
      "suspended": 3,
      "inactive": 12,
      "assigned": 100,
      "unassigned": 50,
      "recentRegistrations": 25,
      "recentApprovals": 20
    },
    "recentObservers": [
      {
        "id": "uuid",
        "trackingNumber": "OBS001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "status": "approved",
        "submissionDate": "2024-01-15T10:30:00Z"
      }
    ],
    "analytics": {
      "registrationTrends": [...],
      "statusDistribution": [...],
      "activityMetrics": {...}
    }
  }
}
```

---

## 5. Export Observers

**GET** `/api/v1/admin/observers/export`

Export observers to CSV format with optional filtering.

### Query Parameters

Same as list observers endpoint.

### Response

Returns a CSV file with the following columns:

- Tracking Number
- First Name
- Last Name
- Email
- Phone Number
- National ID
- Status
- Preferred County
- Preferred Constituency
- Preferred Ward
- Preferred Station
- Submission Date
- Review Date
- Reviewer
- Review Notes
- Rejection Reason
- Created At
- Updated At

---

## 6. Get Observer by ID

**GET** `/api/v1/admin/observers/:id`

Get detailed information about a specific observer.

### Path Parameters

| Parameter | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| `id`      | string | Yes      | Observer UUID |

### Response

```json
{
  "success": true,
  "message": "Observer retrieved successfully",
  "data": {
    "id": "uuid",
    "trackingNumber": "OBS001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+254712345678",
    "nationalId": "12345678",
    "dateOfBirth": "1990-05-15T00:00:00Z",
    "status": "approved",
    "submissionDate": "2024-01-15T10:30:00Z",
    "reviewDate": "2024-01-16T14:20:00Z",
    "reviewNotes": "Approved after document verification",
    "preferredCounty": {
      "id": "uuid",
      "name": "Nairobi"
    },
    "preferredConstituency": {
      "id": "uuid",
      "name": "Westlands"
    },
    "preferredWard": {
      "id": "uuid",
      "name": "Parklands"
    },
    "preferredStation": {
      "id": "uuid",
      "name": "Westlands Primary School"
    },
    "reviewer": {
      "id": "uuid",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    },
    "user": {
      "id": "uuid",
      "isActive": true,
      "lastLogin": "2024-01-20T09:15:00Z"
    },
    "assignments": [
      {
        "id": "uuid",
        "pollingStation": {
          "id": "uuid",
          "name": "Westlands Primary School",
          "constituency": {
            "name": "Westlands"
          }
        },
        "assignmentDate": "2024-01-17T10:00:00Z",
        "assigner": {
          "id": "uuid",
          "firstName": "Admin",
          "lastName": "User"
        }
      }
    ],
    "termsAccepted": true,
    "dataProcessingConsent": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:20:00Z"
  }
}
```

---

## 7. Update Observer

**PUT** `/api/v1/admin/observers/:id`

Update observer information.

### Path Parameters

| Parameter | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| `id`      | string | Yes      | Observer UUID |

### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+254712345678",
  "email": "john.doe@example.com",
  "status": "approved",
  "location": "Nairobi",
  "reviewNotes": "Updated after additional verification",
  "rejectionReason": null
}
```

### Response

```json
{
  "success": true,
  "message": "Observer updated successfully",
  "data": {
    "id": "uuid",
    "trackingNumber": "OBS001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+254712345678",
    "status": "approved",
    "reviewNotes": "Updated after additional verification",
    "reviewDate": "2024-01-16T14:20:00Z",
    "reviewedBy": "admin-user-id",
    "updatedAt": "2024-01-16T14:20:00Z"
  }
}
```

---

## 8. Delete Observer

**DELETE** `/api/v1/admin/observers/:id`

Soft delete an observer by changing status to inactive.

### Path Parameters

| Parameter | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| `id`      | string | Yes      | Observer UUID |

### Response

```json
{
  "success": true,
  "message": "Observer deactivated successfully",
  "data": {
    "id": "uuid",
    "status": "inactive",
    "reviewDate": "2024-01-16T14:20:00Z",
    "reviewedBy": "admin-user-id",
    "reviewNotes": "Observer deactivated by admin",
    "updatedAt": "2024-01-16T14:20:00Z"
  }
}
```

---

## 9. Bulk Update Observer Status

**POST** `/api/v1/admin/observers/bulk-update`

Update multiple observers' status at once.

### Request Body

```json
{
  "observerIds": ["uuid1", "uuid2", "uuid3"],
  "status": "approved",
  "notes": "Bulk approval after document verification"
}
```

### Response

```json
{
  "success": true,
  "message": "Successfully updated 3 observers",
  "data": {
    "updatedCount": 3
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed: Email already registered",
  "error": "ValidationError",
  "details": [
    {
      "field": "email",
      "message": "Email already registered"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required",
  "error": "UnauthorizedError"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "ForbiddenError"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Observer not found",
  "error": "NotFoundError"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "InternalServerError"
}
```

---

## Rate Limiting

- **List/Export endpoints**: 100 requests per minute
- **Update/Delete endpoints**: 50 requests per minute
- **Analytics endpoints**: 20 requests per minute

---

## Examples

### Get all pending observers

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.etally.com/api/v1/admin/observers?status=pending_review"
```

### Search for observers by name

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.etally.com/api/v1/admin/observers?search=john&sortBy=name&sortOrder=asc"
```

### Export approved observers

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.etally.com/api/v1/admin/observers/export?status=approved" \
  -o observers.csv
```

### Update observer status

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "reviewNotes": "Documents verified"}' \
  "https://api.etally.com/api/v1/admin/observers/uuid"
```

### Bulk approve observers

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"observerIds": ["uuid1", "uuid2"], "status": "approved", "notes": "Bulk approval"}' \
  "https://api.etally.com/api/v1/admin/observers/bulk-update"
```
