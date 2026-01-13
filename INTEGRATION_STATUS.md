
# Backend Integration Status - Doula Connect

## Overview

This document tracks the integration status between the Doula Connect frontend and backend API.

**Backend URL:** `https://58wab47v29usdn5dvkdh2bb8tmk9hce6.app.specular.dev`

---

## ✅ Completed Integrations

### 1. Email OTP Authentication
**Status:** ✅ Fully Integrated and Working

**Frontend Files:**
- `app/auth/email.tsx`

**Backend Endpoints:**
- `POST /auth/send-otp` ✅
- `POST /auth/verify-otp` ✅

**Features:**
- Send 6-digit OTP code to email
- Verify OTP code with rate limiting
- Auto-focus OTP input fields
- Resend OTP with countdown timer
- Error handling with user-friendly messages

**Testing:**
```bash
# Test OTP send
curl -X POST https://58wab47v29usdn5dvkdh2bb8tmk9hce6.app.specular.dev/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test OTP verify
curl -X POST https://58wab47v29usdn5dvkdh2bb8tmk9hce6.app.specular.dev/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

---

## ⏳ Partially Integrated (Backend Endpoints Missing)

### 2. User Registration
**Status:** ⏳ Frontend Ready, Backend Not Implemented

**Frontend Files:**
- `app/registration/parent.tsx`
- `app/registration/doula.tsx`

**Required Backend Endpoints:**
- `POST /api/users/parent` ❌
- `POST /api/users/doula` ❌
- `POST /api/upload/profile-picture` ❌
- `POST /api/upload/certification` ❌

**Current Behavior:**
- Frontend collects all registration data
- API calls are made but will fail with 404
- User-friendly error messages explain backend is not ready
- Fallback IDs are generated for local testing

**What Happens When User Tries to Register:**
1. User fills out registration form
2. Frontend validates all fields
3. Frontend attempts to call backend API
4. Backend returns 404 (endpoint not found)
5. User sees: "Backend Not Ready - The user registration endpoint is not yet implemented"

---

### 3. Matching System
**Status:** ⏳ Frontend Ready, Backend Not Implemented

**Frontend Files:**
- `app/(tabs)/connect.tsx`

**Required Backend Endpoints:**
- `GET /api/matches?userId={userId}&userType={userType}` ❌

**Current Behavior:**
- Frontend attempts to fetch matches
- Shows loading indicator
- Fails gracefully with empty matches list
- No error shown to user (silent failure)

---

### 4. Contract Management
**Status:** ⏳ Frontend Ready, Backend Not Implemented

**Frontend Files:**
- `app/(tabs)/connect.tsx`

**Required Backend Endpoints:**
- `POST /api/contracts` ❌
- `GET /api/contracts/user/:userId` ❌

**Current Behavior:**
- "Start Contract" button is visible
- Clicking shows "Backend Not Ready" alert
- No contracts are created

---

### 5. Comments & Reviews
**Status:** ⏳ Frontend Ready, Backend Not Implemented

**Frontend Files:**
- `app/(tabs)/connect.tsx`

**Required Backend Endpoints:**
- `POST /api/comments` ❌
- `GET /api/comments/doula/:doulaId` ❌

**Current Behavior:**
- Comment input is visible for eligible users
- Submitting shows "Backend Not Ready" alert
- No comments are stored or displayed

---

### 6. Profile Management
**Status:** ⏳ Frontend Ready, Backend Not Implemented

**Frontend Files:**
- `app/(tabs)/profile.tsx`

**Required Backend Endpoints:**
- `PUT /api/users/profile/:id` ❌

**Current Behavior:**
- Profile displays correctly from local state
- Edit mode works
- Saving shows "Backend Not Ready" alert
- Changes are not persisted

---

### 7. Payment Processing
**Status:** ⏳ Frontend Ready, Backend Not Implemented

**Frontend Files:**
- `app/payment.tsx`

**Required Backend Endpoints:**
- `POST /api/payments/create-checkout-session` ❌

**Current Behavior:**
- Payment screen displays correctly
- Clicking "Pay" shows "Backend Not Ready" alert
- No Stripe checkout session is created

---

## 📋 Integration Checklist

### Phase 1: Critical (App Won't Work Without These)
- [ ] Implement `POST /api/users/parent` endpoint
- [ ] Implement `POST /api/users/doula` endpoint
- [ ] Implement `POST /api/upload/profile-picture` endpoint
- [ ] Implement `POST /api/upload/certification` endpoint
- [ ] Test user registration flow end-to-end

### Phase 2: Core Features
- [ ] Implement `GET /api/matches` endpoint with matching algorithm
- [ ] Implement `PUT /api/users/profile/:id` endpoint
- [ ] Test matching and profile updates

### Phase 3: Enhanced Features
- [ ] Implement `POST /api/contracts` endpoint
- [ ] Implement `GET /api/contracts/user/:userId` endpoint
- [ ] Implement `POST /api/comments` endpoint
- [ ] Implement `GET /api/comments/doula/:doulaId` endpoint
- [ ] Test contract and comment workflows

### Phase 4: Monetization
- [ ] Set up Stripe account and get API keys
- [ ] Implement `POST /api/payments/create-checkout-session` endpoint
- [ ] Implement `GET /api/payments/status/:sessionId` endpoint
- [ ] Implement `PUT /api/users/subscription` endpoint
- [ ] Set up Stripe webhooks for subscription events
- [ ] Test payment flow end-to-end

---

## 🔧 API Utilities

### Backend URL Configuration
The backend URL is automatically configured in `app.json`:
```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://58wab47v29usdn5dvkdh2bb8tmk9hce6.app.specular.dev"
    }
  }
}
```

### API Helper Functions
Located in `utils/api.ts`:

```typescript
// Basic API calls
import { apiGet, apiPost, apiPut, apiDelete, BACKEND_URL } from '@/utils/api';

// Authenticated API calls (with bearer token)
import { authenticatedGet, authenticatedPost, authenticatedPut } from '@/utils/api';

// Example usage
const response = await apiPost('/auth/send-otp', { email: 'test@example.com' });
```

### Error Handling
All API calls include:
- Automatic error logging with `console.error`
- User-friendly error messages
- Detection of "endpoint not found" errors (404)
- Graceful fallbacks where possible

---

## 🧪 Testing the Integration

### Test OTP Authentication (Working)
1. Open the app
2. Go through welcome screen
3. Enter email on auth screen
4. Click "Send Verification Code"
5. Check email for OTP code
6. Enter OTP code
7. Should proceed to registration

### Test User Registration (Will Fail - Expected)
1. Complete OTP verification
2. Fill out registration form
3. Click "Continue to Payment"
4. Should see "Backend Not Ready" alert
5. This is expected until backend endpoints are implemented

### Test Other Features (Will Fail - Expected)
- Matching: Will show "No matches found"
- Contracts: Will show "Backend Not Ready" alert
- Comments: Will show "Backend Not Ready" alert
- Profile Updates: Will show "Backend Not Ready" alert
- Payments: Will show "Backend Not Ready" alert

---

## 📚 Documentation

### For Backend Developers
See `BACKEND_API_REQUIREMENTS.md` for:
- Complete API endpoint specifications
- Request/response formats
- Database schema recommendations
- Implementation priorities
- Testing recommendations

### For Frontend Developers
See `utils/api.ts` for:
- API helper function documentation
- Usage examples
- Error handling patterns
- Authentication token management

---

## 🚀 Next Steps

1. **Backend Team:**
   - Review `BACKEND_API_REQUIREMENTS.md`
   - Implement Phase 1 endpoints (user registration)
   - Test with frontend using provided curl commands
   - Deploy and update backend URL if needed

2. **Frontend Team:**
   - Monitor backend implementation progress
   - Test each endpoint as it becomes available
   - Update this document with integration status
   - Report any issues or discrepancies

3. **QA Team:**
   - Test OTP authentication flow (already working)
   - Prepare test cases for upcoming features
   - Test error handling and edge cases
   - Verify user experience with error messages

---

## 📞 Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify backend URL in `app.json`
3. Test backend endpoints directly with curl
4. Review `utils/api.ts` for API call implementation
5. Check `BACKEND_API_REQUIREMENTS.md` for endpoint specifications

---

**Last Updated:** January 2024
**Backend URL:** https://58wab47v29usdn5dvkdh2bb8tmk9hce6.app.specular.dev
**Integration Status:** 1/7 features fully working (OTP Authentication)
