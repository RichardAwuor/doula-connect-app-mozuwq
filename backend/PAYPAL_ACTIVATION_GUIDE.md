# PayPal Payment Integration - Activation Guide

## Status: ✅ Implementation Complete & Ready

The backend PayPal payment processing is **fully implemented and ready to use**. You just need to configure your PayPal credentials.

---

## Why Payment Processing Is Not Working

**Reason:** PayPal credentials (`PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`) are not set in the `.env` file.

**Current Status:**
```
❌ PayPal service: NOT INITIALIZED
❌ POST /payments/create-session: Returns 503 (Service Unavailable)
❌ Payment processing: DISABLED
```

**Solution:** Follow the steps below to get and configure your PayPal credentials.

---

## Step 1: Create PayPal Developer Account

1. Visit [PayPal Developer Dashboard](https://developer.paypal.com)
2. Sign up or log in with your PayPal account
3. Accept the terms and create your developer account

---

## Step 2: Get Your API Credentials

### Option A: Sandbox (Testing/Development)

1. In PayPal Developer Dashboard, click **Apps & Credentials**
2. Ensure **Sandbox** is selected at the top
3. Under **REST API apps**, you'll see a default app or create a new one
4. Click on the app name to expand it
5. Copy these credentials:
   - **Client ID** (App ID)
   - **Secret** (Client Secret)

### Option B: Live (Production)

1. In PayPal Developer Dashboard, click **Apps & Credentials**
2. Switch to **Live** tab at the top
3. Under **REST API apps**, create a new app or use existing
4. Copy these credentials:
   - **Client ID**
   - **Secret**

---

## Step 3: Configure Environment Variables

### Create `.env` File (if not already created)

1. In the backend root directory, create or edit `.env`:

```bash
# Copy from .env.example if it exists
cp .env.example .env
```

### Edit `.env` with Your Credentials

Add or update these lines:

```env
# PayPal Payment Configuration
PAYPAL_CLIENT_ID=APP-your_actual_client_id_here
PAYPAL_CLIENT_SECRET=your_actual_secret_here
PAYPAL_WEBHOOK_ID=your_webhook_id_here

# Other configuration
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Example of filled configuration:**
```env
PAYPAL_CLIENT_ID=APP-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
PAYPAL_CLIENT_SECRET=ELmwmCvYPdazyDz2A4xF8XvYmJ7aBcDeFgHiJkLmNoPqRsTuVwXyZ1a2b3c4d5e6f7g8h
PAYPAL_WEBHOOK_ID=8ph123456789abcdefghijklmnopqrstu
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### For Development (Sandbox)

```env
NODE_ENV=development
PAYPAL_CLIENT_ID=APP-...  # Sandbox credentials
PAYPAL_CLIENT_SECRET=...
```

### For Production (Live)

```env
NODE_ENV=production
PAYPAL_CLIENT_ID=APP-...  # Live credentials
PAYPAL_CLIENT_SECRET=...
```

---

## Step 4: Restart the Server

After updating `.env`, restart the backend:

```bash
# Kill current server (Ctrl+C)
# Then restart
npm run dev
```

**Expected Startup Logs:**
```
Initializing PayPal payment service...
PayPal client successfully initialized in Sandbox mode
✓ PayPal payment service initialized successfully - Payment processing is ENABLED
```

---

## Step 5: Verify PayPal Is Working

### Check PayPal Status

```bash
curl http://localhost:8000/status/paypal
```

**Expected Response (Success):**
```json
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "PayPal payment processing is operational"
}
```

**Error Response (Not Configured):**
```json
{
  "initialized": true,
  "available": false,
  "error": "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables are required...",
  "message": "PayPal is not available: ..."
}
```

---

## Step 6: Test Creating a PayPal Order

### Create a Test Order

```bash
curl -X POST http://localhost:8000/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "userType": "parent",
    "planType": "annual",
    "email": "test@example.com"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "orderId": "5O190127TN364715T",
  "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=EC-5O190127TN364715T"
}
```

**Error Response (PayPal Not Configured):**
```json
{
  "error": "Payment processing is currently unavailable. PayPal credentials not configured.",
  "details": "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables are required..."
}
```

---

## API Endpoints Summary

Once PayPal is configured, these endpoints will be active:

### POST /payments/create-session
**Create a PayPal order for subscription**

```bash
Request:
{
  "userId": "user-uuid",
  "userType": "parent",    # or "doula"
  "planType": "annual",    # "annual" for parent, "monthly" for doula
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "orderId": "order-id-from-paypal",
  "approvalUrl": "https://www.paypal.com/checkoutnow?token=..."
}

Response (503):
{
  "error": "Payment processing is currently unavailable...",
  "details": "..."
}
```

### GET /status/paypal
**Check PayPal service status**

```bash
Response:
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "PayPal payment processing is operational"
}
```

### POST /payments/webhook
**Handle PayPal webhook events** (automatic)

### GET /subscriptions/:userId
**Get subscription status**

### PUT /subscriptions/:userId
**Update subscription status**

---

## Troubleshooting

### Problem: "PayPal credentials not configured"

**Solution:**
1. Check `.env` file exists in backend root
2. Verify these lines are present:
   ```env
   PAYPAL_CLIENT_ID=your_actual_id
   PAYPAL_CLIENT_SECRET=your_actual_secret
   ```
3. Check credentials are NOT wrapped in quotes or brackets
4. Restart server: `npm run dev`
5. Test: `curl http://localhost:8000/status/paypal`

### Problem: "Invalid credentials"

**Solution:**
1. Verify credentials in PayPal Developer Dashboard
2. Make sure you're using Sandbox credentials for `NODE_ENV=development`
3. Make sure you're using Live credentials for `NODE_ENV=production`
4. Copy-paste credentials carefully (no extra spaces)
5. Restart server

### Problem: "Order creation fails"

**Solution:**
1. Verify PayPal credentials are correct: `curl http://localhost:8000/status/paypal`
2. Check server logs for detailed error message
3. Ensure `NODE_ENV` matches credential type (sandbox for test, live for production)
4. Test request format with all required fields

### Problem: "Webhook not received"

**Solution:**
1. Configure webhook in PayPal Developer Dashboard:
   - Go to **Webhooks**
   - Create webhook with URL: `https://yourdomain.com/payments/webhook`
   - Select events: `CHECKOUT.ORDER.APPROVED`, `BILLING.SUBSCRIPTION.CANCELLED`
2. Copy webhook ID to `.env`:
   ```env
   PAYPAL_WEBHOOK_ID=whsec_...
   ```
3. Restart server

---

## Payment Pricing

✅ **Parent Annual Plan:** $99.00/year
✅ **Doula Monthly Plan:** $99.00/month

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/services/paypal-service.ts` | PayPal client initialization and management |
| `src/routes/payments.ts` | Payment endpoints (create order, webhook, subscriptions) |
| `src/routes/health.ts` | Health check endpoints including PayPal status |
| `src/db/schema.ts` | Database schema with PayPal fields |
| `.env.example` | Example environment configuration |
| `.env.template` | Detailed configuration guide |

---

## Quick Checklist

- [ ] Create PayPal Developer account
- [ ] Get Client ID and Secret from Sandbox/Live app
- [ ] Create `.env` file in backend root
- [ ] Add PAYPAL_CLIENT_ID to `.env`
- [ ] Add PAYPAL_CLIENT_SECRET to `.env`
- [ ] Set NODE_ENV to "development" for Sandbox
- [ ] Restart backend: `npm run dev`
- [ ] Test: `curl http://localhost:8000/status/paypal`
- [ ] Expected response: `"available": true`
- [ ] Test creating order: `curl -X POST http://localhost:8000/payments/create-session ...`

---

## Next Steps

1. **Get Credentials:** Follow PayPal Developer setup above
2. **Configure:** Add to `.env` file
3. **Activate:** Restart server
4. **Verify:** Check `/status/paypal` endpoint
5. **Test:** Create test orders using `/payments/create-session`
6. **Deploy:** Use Live credentials for production

---

## Support Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs)
- [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2)
- [PayPal Webhooks](https://developer.paypal.com/docs/api/webhooks)
- Check server logs: `npm run dev` (shows all PayPal initialization details)

---

## Summary

✅ **Backend PayPal integration:** COMPLETE
⏳ **PayPal initialization:** WAITING FOR CREDENTIALS
❌ **Payment processing:** DISABLED (awaiting configuration)

**Your next step:** Get PayPal credentials and add them to `.env` file!
