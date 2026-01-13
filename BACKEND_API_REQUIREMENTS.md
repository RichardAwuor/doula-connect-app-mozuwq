
# Backend API Requirements for Doula Connect

## Current Status

### ✅ Implemented Endpoints

The backend currently has **OTP authentication** implemented:

1. **POST /auth/send-otp**
   - Sends a 6-digit OTP code to the provided email
   - Request: `{ email: string }`
   - Response: `{ success: boolean, message: string, expiresIn: number }`

2. **POST /auth/verify-otp**
   - Verifies the OTP code
   - Request: `{ email: string, code: string }`
   - Response: `{ success: boolean, message: string }`

3. **DELETE /auth/cleanup-otps**
   - Cleans up expired OTP records
   - Response: `{ success: boolean, message: string }`

### ❌ Missing Endpoints (Required for Full Functionality)

The following endpoints need to be implemented for the app to work completely:

---

## 1. User Registration & Profile Management

### POST /api/users/parent
Create a new parent profile after email verification.

**Request Body:**
```json
{
  "email": "parent@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "state": "California",
  "town": "Los Angeles",
  "zipCode": "90001",
  "serviceCategories": ["birth", "postpartum"],
  "financingType": ["self", "carrot"],
  "servicePeriodStart": "2024-03-01T00:00:00.000Z",
  "servicePeriodEnd": "2024-06-01T00:00:00.000Z",
  "preferredLanguages": ["English", "Spanish"],
  "desiredDays": ["Monday", "Wednesday", "Friday"],
  "desiredStartTime": "2024-01-01T09:00:00.000Z",
  "desiredEndTime": "2024-01-01T17:00:00.000Z",
  "acceptedTerms": true
}
```

**Response:**
```json
{
  "success": true,
  "userId": "parent_123456",
  "profile": { /* ParentProfile object */ }
}
```

---

### POST /api/users/doula
Create a new doula profile after email verification.

**Request Body:**
```json
{
  "email": "doula@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "state": "California",
  "town": "Los Angeles",
  "zipCode": "90001",
  "paymentPreferences": ["self", "carrot", "medicaid"],
  "driveDistance": 25,
  "spokenLanguages": ["English", "Spanish"],
  "hourlyRateMin": 30,
  "hourlyRateMax": 50,
  "serviceCategories": ["birth", "postpartum"],
  "certifications": ["doula_certification", "basic_life_support"],
  "profilePictureUrl": "https://storage.example.com/profile.jpg",
  "certificationDocuments": ["https://storage.example.com/cert1.pdf"],
  "referees": [
    {
      "firstName": "Reference",
      "lastName": "Person",
      "email": "reference@example.com"
    }
  ],
  "acceptedTerms": true
}
```

**Response:**
```json
{
  "success": true,
  "userId": "doula_123456",
  "profile": { /* DoulaProfile object */ }
}
```

---

### PUT /api/users/profile/:id
Update an existing user profile.

**Request Body:** (varies by user type)
```json
{
  "firstName": "Updated Name",
  "state": "New York",
  "town": "New York City",
  "zipCode": "10001",
  // ... other updatable fields
}
```

**Response:**
```json
{
  "success": true,
  "profile": { /* Updated profile object */ }
}
```

---

## 2. File Upload Endpoints

### POST /api/upload/profile-picture
Upload a profile picture for doulas.

**Request:** `multipart/form-data` with `image` field
**Response:**
```json
{
  "success": true,
  "url": "https://storage.example.com/profiles/doula_123456.jpg"
}
```

**Notes:**
- Accept JPEG, PNG formats
- Resize/optimize images (recommended: 800x800px max)
- Store in cloud storage (AWS S3, Google Cloud Storage, etc.)

---

### POST /api/upload/certification
Upload certification documents for doulas.

**Request:** `multipart/form-data` with `document` field
**Response:**
```json
{
  "success": true,
  "url": "https://storage.example.com/certifications/cert_123456.pdf"
}
```

**Notes:**
- Accept PDF, JPEG, PNG formats
- Max file size: 10MB
- Store securely with access controls

---

## 3. Matching System

### GET /api/matches?userId={userId}&userType={userType}
Get matching profiles based on user preferences.

**Query Parameters:**
- `userId`: User ID requesting matches
- `userType`: Either "parent" or "doula"

**Response:**
```json
{
  "success": true,
  "matches": [
    { /* DoulaProfile or ParentProfile object */ },
    { /* ... */ }
  ]
}
```

**Matching Algorithm Requirements:**

For **Parents** (finding doulas):
- Match by location (state, town, doula's drive distance)
- Match by service categories (birth/postpartum)
- Match by languages
- Match by payment preferences
- Sort by rating (if available)

For **Doulas** (finding parents):
- Match by location (within doula's drive distance)
- Match by service categories
- Match by languages
- Match by payment preferences
- Show parents with active subscriptions first

---

## 4. Contract Management

### POST /api/contracts
Create a new contract between parent and doula.

**Request Body:**
```json
{
  "parentId": "parent_123456",
  "doulaId": "doula_789012",
  "startDate": "2024-03-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": "contract_345678",
    "parentId": "parent_123456",
    "doulaId": "doula_789012",
    "startDate": "2024-03-01T00:00:00.000Z",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Contract Status Values:**
- `active` - Contract is currently active
- `completed` - Contract has been completed (after 7+ days)
- `cancelled` - Contract was cancelled

---

### GET /api/contracts/user/:userId
Get all contracts for a specific user.

**Response:**
```json
{
  "success": true,
  "contracts": [
    {
      "id": "contract_345678",
      "parentId": "parent_123456",
      "doulaId": "doula_789012",
      "startDate": "2024-03-01T00:00:00.000Z",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 5. Comments & Reviews

### POST /api/comments
Create a comment/review for a doula.

**Request Body:**
```json
{
  "contractId": "contract_345678",
  "doulaId": "doula_789012",
  "parentId": "parent_123456",
  "comment": "Excellent service! Very professional and caring."
}
```

**Validation Rules:**
- Contract must exist and be completed
- Parent must not have already commented on this contract
- Comment must be <= 160 characters
- Contract must be at least 7 days old

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "comment_901234",
    "contractId": "contract_345678",
    "doulaId": "doula_789012",
    "parentId": "parent_123456",
    "parentName": "John Doe",
    "comment": "Excellent service! Very professional and caring.",
    "createdAt": "2024-01-22T14:30:00.000Z"
  }
}
```

---

### GET /api/comments/doula/:doulaId
Get all comments for a specific doula.

**Response:**
```json
{
  "success": true,
  "comments": [
    {
      "id": "comment_901234",
      "contractId": "contract_345678",
      "doulaId": "doula_789012",
      "parentId": "parent_123456",
      "parentName": "John Doe",
      "comment": "Excellent service! Very professional and caring.",
      "createdAt": "2024-01-22T14:30:00.000Z"
    }
  ]
}
```

---

## 6. Payment Processing (Stripe Integration)

### POST /api/payments/create-checkout-session
Create a Stripe Checkout session for subscription payment.

**Request Body:**
```json
{
  "userId": "parent_123456",
  "userType": "parent",
  "email": "parent@example.com"
}
```

**Stripe Configuration:**
- **Amount:** $99.00 USD
- **Period:** 
  - Annual for parents
  - Monthly for doulas
- **Success URL:** `{frontend_url}/payment-success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel URL:** `{frontend_url}/payment`

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

---

### GET /api/payments/status/:sessionId
Check the status of a payment session.

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "userId": "parent_123456"
}
```

**Status Values:**
- `pending` - Payment not yet completed
- `completed` - Payment successful
- `failed` - Payment failed

---

### PUT /api/users/subscription
Update user subscription status.

**Request Body:**
```json
{
  "userId": "parent_123456",
  "subscriptionActive": true
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Database Schema Recommendations

### Tables Required

1. **users**
   - id (primary key)
   - email (unique)
   - userType ('parent' | 'doula')
   - createdAt
   - updatedAt

2. **parent_profiles**
   - id (primary key)
   - userId (foreign key to users)
   - firstName
   - lastName
   - state
   - town
   - zipCode
   - serviceCategories (JSON array)
   - financingType (JSON array)
   - servicePeriodStart
   - servicePeriodEnd
   - preferredLanguages (JSON array)
   - desiredDays (JSON array)
   - desiredStartTime
   - desiredEndTime
   - acceptedTerms
   - subscriptionActive

3. **doula_profiles**
   - id (primary key)
   - userId (foreign key to users)
   - firstName
   - lastName
   - state
   - town
   - zipCode
   - paymentPreferences (JSON array)
   - driveDistance
   - spokenLanguages (JSON array)
   - hourlyRateMin
   - hourlyRateMax
   - serviceCategories (JSON array)
   - certifications (JSON array)
   - profilePictureUrl
   - certificationDocuments (JSON array)
   - referees (JSON array)
   - acceptedTerms
   - subscriptionActive
   - rating (calculated from comments)
   - reviewCount

4. **contracts**
   - id (primary key)
   - parentId (foreign key to users)
   - doulaId (foreign key to users)
   - startDate
   - status ('active' | 'completed' | 'cancelled')
   - createdAt
   - updatedAt

5. **comments**
   - id (primary key)
   - contractId (foreign key to contracts)
   - doulaId (foreign key to users)
   - parentId (foreign key to users)
   - comment (text, max 160 chars)
   - createdAt

6. **subscriptions**
   - id (primary key)
   - userId (foreign key to users)
   - stripeCustomerId
   - stripeSubscriptionId
   - status ('active' | 'cancelled' | 'past_due')
   - currentPeriodStart
   - currentPeriodEnd
   - createdAt
   - updatedAt

7. **otp_codes** (already implemented)
   - email
   - code
   - expiresAt
   - attempts

---

## Environment Variables Needed

```env
# Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Storage (AWS S3 example)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=doula-connect-uploads
AWS_REGION=us-east-1

# Email (for OTP - already configured)
RESEND_API_KEY=...

# Frontend URL (for Stripe redirects)
FRONTEND_URL=https://your-app.com
```

---

## Implementation Priority

### Phase 1 (Critical - App won't work without these):
1. User registration endpoints (POST /api/users/parent, POST /api/users/doula)
2. File upload endpoints (POST /api/upload/profile-picture, POST /api/upload/certification)

### Phase 2 (Core Features):
3. Matching system (GET /api/matches)
4. Profile updates (PUT /api/users/profile/:id)

### Phase 3 (Enhanced Features):
5. Contract management (POST /api/contracts, GET /api/contracts/user/:userId)
6. Comments system (POST /api/comments, GET /api/comments/doula/:doulaId)

### Phase 4 (Monetization):
7. Payment processing (Stripe integration)

---

## Testing Recommendations

1. **Unit Tests:** Test each endpoint with valid/invalid data
2. **Integration Tests:** Test complete user flows (registration → matching → contract → payment)
3. **Load Tests:** Ensure matching algorithm performs well with many users
4. **Security Tests:** Validate authentication, authorization, and data access controls

---

## Notes

- All endpoints should return consistent error responses:
  ```json
  {
    "success": false,
    "error": "Error message here"
  }
  ```

- Use proper HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 404: Not Found
  - 500: Server Error

- Implement rate limiting on all endpoints
- Add logging for debugging and monitoring
- Use database transactions for operations that modify multiple tables
- Implement proper data validation and sanitization
