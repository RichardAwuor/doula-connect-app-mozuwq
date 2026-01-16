# PayPal Integration Setup Guide

## Overview

The Doula Connect backend has been migrated from Stripe to PayPal for payment processing. PayPal provides a robust solution for handling subscription payments with webhook support for real-time payment notifications.

## Requirements Met

✅ **Create PayPal orders for $99 subscription, return approval URL**
- Implemented in `POST /payments/create-session`
- Returns `orderId` and `approvalUrl` for frontend redirect

✅ **Handle PayPal webhooks for subscription events**
- Implemented in `POST /payments/webhook`
- Handles `CHECKOUT.ORDER.APPROVED` and `BILLING.SUBSCRIPTION.CANCELLED` events

✅ **Retrieve subscription status by user**
- Implemented in `GET /subscriptions/:userId`
- Returns complete subscription details

✅ **Update subscription status by user**
- Implemented in `PUT /subscriptions/:userId`
- Supports status changes (active, cancelled, expired)

✅ **Store PayPal customer and subscription identifiers in database**
- Schema updated with `paypalCustomerId`, `paypalOrderId`, `paypalSubscriptionId`
- Tracks all PayPal-related identifiers for each subscription

## Step 1: Get PayPal Credentials

### Create a PayPal Developer Account

1. Go to [PayPal Developer](https://developer.paypal.com)
2. Sign up or log in to your PayPal account
3. Navigate to **Apps & Credentials**
4. Select **Sandbox** for testing (or **Live** for production)

### Get Your API Credentials

1. In **Apps & Credentials**, create a new app or use the default app
2. Copy the following credentials:
   - **Client ID** (starts with `APP-...`)
   - **Secret** (long alphanumeric string)

### Create a Webhook

1. Go to **Webhooks** in PayPal Developer
2. Click **Create Webhook**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/payments/webhook
   ```
4. Select these events to listen for:
   - `CHECKOUT.ORDER.APPROVED`
   - `CHECKOUT.ORDER.COMPLETED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
5. Copy the **Webhook ID**

## Step 2: Configure Environment Variables

Create or update `.env` file in the backend root directory:

```env
PAYPAL_CLIENT_ID=APP-your_actual_client_id_here
PAYPAL_CLIENT_SECRET=your_actual_secret_here
PAYPAL_WEBHOOK_ID=your_webhook_id_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Environment-Specific Configuration

**Development (Sandbox):**
```env
NODE_ENV=development
PAYPAL_CLIENT_ID=APP-...  # Sandbox credentials
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
```

**Production (Live):**
```env
NODE_ENV=production
PAYPAL_CLIENT_ID=APP-...  # Live credentials
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
```

## Step 3: Verify Configuration

### Check PayPal Service Status

```bash
curl http://localhost:8000/status/paypal
```

**Expected Response (Configured):**
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

## Step 4: Test Payment Processing

### 1. Create a PayPal Order

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

**Expected Response:**
```json
{
  "success": true,
  "orderId": "5O190127TN364715T",
  "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=EC-5O190127TN364715T"
}
```

### 2. Redirect User to PayPal

Frontend should redirect user to the `approvalUrl` where they can approve the payment.

### 3. Test Webhooks Locally

Use PayPal Webhook Simulator or ngrok to forward webhooks:

```bash
# Forward webhooks to local machine
ngrok http 8000

# Then configure ngrok URL in PayPal Webhooks:
# https://your-ngrok-url.ngrok.io/payments/webhook
```

Or use PayPal's webhook simulator in Developer Dashboard:
- Go to **Webhooks** > Select your webhook
- Click **Send Simulation**
- Select event type and test data
- Check server logs for processing

### 4. Verify Subscription Created

After payment is approved:

```bash
curl http://localhost:8000/subscriptions/test-user-123
```

**Expected Response:**
```json
{
  "id": "...",
  "userId": "test-user-123",
  "paypalCustomerId": "...",
  "paypalOrderId": "5O190127TN364715T",
  "paypalSubscriptionId": null,
  "status": "active",
  "planType": "annual",
  "amount": "99.00",
  "currentPeriodStart": "2025-01-20T12:00:00.000Z",
  "currentPeriodEnd": "2026-01-20T12:00:00.000Z"
}
```

## API Endpoints

### POST /payments/create-session
**Create a PayPal order for subscription**

Request:
```json
{
  "userId": "user-uuid",
  "userType": "parent",      // or "doula"
  "planType": "annual",      // "annual" for parent, "monthly" for doula
  "email": "user@example.com"
}
```

Response (200):
```json
{
  "success": true,
  "orderId": "order-id-from-paypal",
  "approvalUrl": "https://www.paypal.com/checkoutnow?token=..."
}
```

Response (503):
```json
{
  "error": "Payment processing is currently unavailable. PayPal credentials not configured.",
  "details": "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables are required..."
}
```

### POST /payments/webhook
**Handle PayPal webhook events**

PayPal sends webhook events to this endpoint. No authentication required on backend (PayPal verifies via webhook ID).

Events handled:
- `CHECKOUT.ORDER.APPROVED` - Creates subscription
- `CHECKOUT.ORDER.COMPLETED` - Confirms subscription
- `BILLING.SUBSCRIPTION.CANCELLED` - Cancels subscription

### GET /subscriptions/:userId
**Get subscription status for a user**

```bash
curl http://localhost:8000/subscriptions/{userId}
```

Response (200):
```json
{
  "id": "sub-id",
  "userId": "user-id",
  "paypalCustomerId": "cust-id",
  "paypalOrderId": "order-id",
  "paypalSubscriptionId": "sub-id",
  "status": "active",
  "planType": "annual",
  "amount": "99.00",
  "currentPeriodStart": "2025-01-20T...",
  "currentPeriodEnd": "2026-01-20T..."
}
```

### PUT /subscriptions/:userId
**Update subscription status**

Request:
```json
{
  "status": "cancelled"  // "active", "cancelled", or "expired"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Subscription updated successfully"
}
```

### GET /status/paypal
**Check PayPal service status**

```bash
curl http://localhost:8000/status/paypal
```

Response:
```json
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "PayPal payment processing is operational"
}
```

## Database Schema

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  paypal_customer_id TEXT,          -- PayPal Payer ID
  paypal_order_id TEXT,             -- PayPal Order ID
  paypal_subscription_id TEXT,      -- PayPal Subscription ID
  status TEXT NOT NULL,             -- 'active', 'cancelled', 'expired'
  plan_type TEXT NOT NULL,          -- 'annual', 'monthly'
  amount DECIMAL(10,2) NOT NULL,    -- in dollars
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Pricing

| Plan | Price | Duration |
|---|---|---|
| Parent Annual | $99.00 | 1 year |
| Doula Monthly | $99.00 | 1 month |

## Webhook Events

### CHECKOUT.ORDER.APPROVED
Sent when a user approves payment on PayPal. Creates a new subscription.

**Event Structure:**
```json
{
  "event_type": "CHECKOUT.ORDER.APPROVED",
  "id": "event-id",
  "resource": {
    "id": "order-id",
    "payer": {
      "payer_id": "paypal-payer-id",
      "email_address": "buyer@example.com"
    },
    "purchase_units": [
      {
        "custom_id": "{\"userId\":\"...\",\"userType\":\"...\",\"planType\":\"...\"}"
      }
    ]
  }
}
```

### BILLING.SUBSCRIPTION.CANCELLED
Sent when a subscription is cancelled. Updates subscription status.

**Event Structure:**
```json
{
  "event_type": "BILLING.SUBSCRIPTION.CANCELLED",
  "id": "event-id",
  "resource": {
    "id": "subscription-id"
  }
}
```

## Testing with PayPal Sandbox

### Sandbox Accounts

PayPal automatically creates sandbox merchant and buyer accounts when you create a developer account.

### Create Test Accounts

1. In PayPal Developer Dashboard, go to **Accounts**
2. Create a new **Buyer** account for testing
3. Use credentials to log in during checkout

### Test Payments

1. Create order: `POST /payments/create-session`
2. Redirect to PayPal approval URL
3. Log in with sandbox buyer account
4. Approve payment
5. Verify subscription created: `GET /subscriptions/:userId`

## Troubleshooting

### PayPal Service Not Available

**Error:** `"PayPal is not available: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET..."`

**Solutions:**
1. Check `.env` file for `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
2. Ensure credentials are not wrapped in quotes
3. Restart server after updating `.env`
4. Verify credentials in PayPal Developer Dashboard

### Webhook Not Received

**Cause 1:** Webhook endpoint not configured
- Go to PayPal Developer > Webhooks
- Create webhook with correct URL (must be public/HTTPS in production)

**Cause 2:** Wrong webhook ID
- Ensure `PAYPAL_WEBHOOK_ID` matches PayPal Dashboard

**Cause 3:** Event filter not configured
- Enable events in webhook settings:
  - `CHECKOUT.ORDER.APPROVED`
  - `CHECKOUT.ORDER.COMPLETED`
  - `BILLING.SUBSCRIPTION.CANCELLED`

### Order Creation Fails

**Error:** `"Failed to create payment order"`

**Solutions:**
1. Check PayPal credentials are correct
2. Verify `NODE_ENV` matches environment (development=Sandbox, production=Live)
3. Check server logs for detailed error
4. Ensure PayPal API is accessible from your network

### Subscription Not Created After Payment

**Check:**
1. PayPal webhooks are being received (check Webhook logs in Developer Dashboard)
2. Server logs show webhook processing
3. Database has subscription record
4. Event `CHECKOUT.ORDER.APPROVED` is being received

## Production Deployment

### Pre-Deployment Checklist

- [ ] Create PayPal Live account
- [ ] Get Live API credentials (Client ID and Secret)
- [ ] Create webhook in Live environment
- [ ] Set `NODE_ENV=production`
- [ ] Update `PAYPAL_CLIENT_ID` with Live credentials
- [ ] Update `PAYPAL_CLIENT_SECRET` with Live secret
- [ ] Update `PAYPAL_WEBHOOK_ID` with Live webhook ID
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Test payment flow with real payment (small amount)
- [ ] Verify webhook delivery in PayPal Dashboard
- [ ] Set up alerts for payment errors

### Environment Variables for Production

```env
NODE_ENV=production
PAYPAL_CLIENT_ID=APP-[LIVE_CLIENT_ID]
PAYPAL_CLIENT_SECRET=[LIVE_CLIENT_SECRET]
PAYPAL_WEBHOOK_ID=[LIVE_WEBHOOK_ID]
FRONTEND_URL=https://yourdomain.com
```

## Support Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs)
- [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2)
- [PayPal Webhooks](https://developer.paypal.com/docs/api/webhooks)
- [Sandbox Testing](https://developer.paypal.com/docs/platforms/get-started/set-up-sandbox)

## Migration from Stripe

If migrating from Stripe:

1. **Database:** Schema updated with PayPal fields
   - `stripeCustomerId` → `paypalCustomerId`
   - `stripeSubscriptionId` → `paypalOrderId`
   - New field: `paypalSubscriptionId`

2. **Service:** Stripe service replaced with PayPal service
   - `src/services/stripe-service.ts` → `src/services/paypal-service.ts`
   - Environment variables changed from `STRIPE_*` to `PAYPAL_*`

3. **Routes:** Payment endpoints updated for PayPal API
   - Order creation instead of session creation
   - Webhook handling for PayPal events
   - Response format changed

4. **Configuration:** Update all environment files
   - `.env.example` updated
   - `.env.template` updated with PayPal instructions

## Summary

PayPal integration is fully implemented and ready for deployment. All required features are operational:

✅ Create orders and return approval URLs
✅ Handle webhook events
✅ Manage subscriptions
✅ Store PayPal identifiers
✅ Support both Sandbox and Live environments

Just configure your PayPal credentials in `.env` and restart the server!
