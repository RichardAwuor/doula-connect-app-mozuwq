# Payment Processing Troubleshooting Guide

## Overview

This guide helps diagnose why the payment system is not reaching Stripe. The system requires proper Stripe API key configuration to process payments.

## Quick Diagnosis

### 1. Check Stripe Initialization Status

When the server starts, you should see these logs:

**✓ SUCCESS (Payment Enabled):**
```
Initializing Stripe payment service...
✓ Stripe payment service initialized successfully - Payment processing is ENABLED
```

**✗ FAILURE (Payment Disabled):**
```
Initializing Stripe payment service...
✗ Stripe initialization failed: STRIPE_SECRET_KEY environment variable is not set. Payment processing is disabled.
⚠ Payment processing features will be UNAVAILABLE until STRIPE_SECRET_KEY is configured
```

### 2. Check Stripe Service Status

Call the health endpoint to verify Stripe status:

```bash
curl http://localhost:8000/status/stripe
```

**Expected Response (Stripe Enabled):**
```json
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "Stripe payment processing is operational"
}
```

**Error Response (Stripe Disabled):**
```json
{
  "initialized": true,
  "available": false,
  "error": "STRIPE_SECRET_KEY environment variable is not set. Payment processing is disabled.",
  "message": "Stripe is not available: STRIPE_SECRET_KEY environment variable is not set. Payment processing is disabled."
}
```

## Common Issues and Solutions

### Issue 1: Payment Button Returns 503 Error

**Symptom:** When attempting to create a payment session, the response is:
```json
{
  "error": "Payment processing is currently unavailable. Stripe API key not configured.",
  "details": "STRIPE_SECRET_KEY environment variable is not set. Payment processing is disabled."
}
```

**Root Cause:** The `STRIPE_SECRET_KEY` environment variable is not set.

**Solution:**
1. Get your Stripe Secret Key from https://dashboard.stripe.com/apikeys
2. Add to `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_live_your_actual_key_here
   ```
3. Restart the server
4. Verify with health endpoint (see Quick Diagnosis #2)

### Issue 2: Webhook Processing Fails

**Symptom:** Payments complete in Stripe but subscription is not created in the database.

**Server Log Error:**
```
Error processing webhook: Webhook signature verification failed
```

**Root Cause:** The `STRIPE_WEBHOOK_SECRET` is not configured or is incorrect.

**Solution:**
1. Get webhook secret from https://dashboard.stripe.com/webhooks
2. Create a webhook endpoint:
   - URL: `https://yourdomain.com/payments/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
3. Copy the signing secret (starts with `whsec_`)
4. Add to `.env` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```
5. Restart the server

### Issue 3: Missing Stripe Configuration in Development

**Symptom:** Server starts but logs show warnings about missing secrets.

**Root Cause:** Development environment without Stripe configured.

**Solution for Testing:**
1. Create test account at https://stripe.com
2. Use test keys (start with `sk_test_`)
3. Follow "Issue 1" solution above with test keys
4. Server will work with test keys for development

## Understanding the Payment Flow

### 1. Payment Session Creation

**Endpoint:** `POST /payments/create-session`

**Request:**
```json
{
  "userId": "user-uuid",
  "userType": "parent", // or "doula"
  "planType": "annual", // "annual" for parent, "monthly" for doula
  "email": "user@example.com"
}
```

**Server Logs (Success):**
```
Payment session requested { userId: 'user-id', userType: 'parent', ... }
Creating Stripe checkout session { userType: 'parent', planType: 'annual', ... }
Payment session created successfully { sessionId: 'cs_...', userId: 'user-id', ... }
```

**Server Logs (Failure):**
```
Payment session requested { userId: 'user-id', userType: 'parent', ... }
Stripe service is not available - payment processing is disabled { stripeStatus: { initialized: true, available: false, error: '...' } }
```

### 2. Webhook Handling

**Endpoint:** `POST /payments/webhook`

**Expected Flow:**
```
Webhook received from Stripe { sig: 'sig_...' }
Constructing webhook event { bodyLength: 1234 }
Webhook event verified and constructed { eventType: 'checkout.session.completed', eventId: 'evt_...' }
Processing checkout session completion { userId: 'user-id', userType: 'parent', ... }
Creating new subscription { userId: 'user-id' }
Subscription activated successfully { userId: 'user-id' }
```

**Common Webhook Errors:**
```
Stripe webhook signature missing -> Missing stripe-signature header in request
Error processing webhook -> Webhook secret mismatch or invalid signature
```

### 3. Subscription Status Queries

**Endpoint:** `GET /subscriptions/:userId`

**Server Logs (Success):**
```
Fetching subscription status { userId: 'user-id' }
Subscription retrieved successfully { userId: 'user-id', status: 'active' }
```

**Server Logs (Not Found):**
```
Fetching subscription status { userId: 'user-id' }
Subscription not found { userId: 'user-id' }
```

### 4. Subscription Status Updates

**Endpoint:** `PUT /subscriptions/:userId`

**Request:**
```json
{
  "status": "cancelled" // or "active", "expired"
}
```

**Server Logs (Success):**
```
Updating subscription status { userId: 'user-id', newStatus: 'cancelled' }
Subscription status updated successfully { userId: 'user-id', oldStatus: 'active', newStatus: 'cancelled' }
```

## Debugging Checklist

- [ ] Server logs show "Stripe payment service initialized successfully"
- [ ] `/status/stripe` endpoint returns `"available": true`
- [ ] `STRIPE_SECRET_KEY` is set in `.env`
- [ ] `STRIPE_SECRET_KEY` starts with `sk_live_` or `sk_test_`
- [ ] `STRIPE_WEBHOOK_SECRET` is set in `.env` (required for production)
- [ ] `STRIPE_WEBHOOK_SECRET` starts with `whsec_`
- [ ] Webhook URL is configured in Stripe dashboard
- [ ] Webhook endpoint is publicly accessible
- [ ] Payment session endpoint returns `sessionId` and `checkoutUrl`
- [ ] Frontend redirects to Stripe checkout URL successfully
- [ ] Webhook logs show events being processed

## Testing the Payment Flow

### 1. Verify Stripe Service

```bash
# Check if Stripe is initialized
curl http://localhost:8000/status/stripe

# Expected (Stripe enabled):
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "Stripe payment processing is operational"
}
```

### 2. Create a Test Payment Session

```bash
# Create payment session for a parent
curl -X POST http://localhost:8000/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "userType": "parent",
    "planType": "annual",
    "email": "test@example.com"
  }'

# Expected Response:
{
  "success": true,
  "sessionId": "cs_test_...",
  "clientSecret": "...",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### 3. Test Subscription Retrieval

```bash
# After completing a payment, check subscription status
curl http://localhost:8000/subscriptions/test-user-id

# Expected Response:
{
  "id": "sub-uuid",
  "userId": "test-user-id",
  "status": "active",
  "planType": "annual",
  "amount": "99.00",
  "currentPeriodEnd": "2025-12-20T15:30:00.000Z"
}
```

## Production Checklist

Before deploying to production:

1. **Use Live Keys**
   - Replace test keys with live keys from Stripe dashboard
   - Never commit live keys to version control

2. **Configure Webhook Endpoint**
   - Set webhook URL to your production domain
   - Copy webhook signing secret to production environment
   - Test webhook delivery in Stripe dashboard

3. **Enable HTTPS**
   - Webhook endpoint must be publicly accessible
   - Stripe sends webhooks over HTTPS only

4. **Monitor Webhook Delivery**
   - Check Stripe dashboard > Developers > Webhooks > Events
   - Verify `checkout.session.completed` events are being received

5. **Set Up Alerts**
   - Monitor logs for payment failures
   - Set up alerts for webhook errors
   - Track subscription creation/cancellation events

6. **Environment Variables**
   - Ensure `STRIPE_SECRET_KEY` is set
   - Ensure `STRIPE_WEBHOOK_SECRET` is set
   - Use environment-specific secrets (live for production, test for dev)

## Log Analysis Guide

### Server Startup Logs

```
# Healthy startup
Initializing Stripe payment service...
Stripe client successfully initialized with API key
✓ Stripe payment service initialized successfully - Payment processing is ENABLED
Stripe status: {"initialized":true,"available":true,"error":null}
```

### Payment Creation Logs

```
# Successful payment session creation
Payment session requested { userId: '123', userType: 'parent', ... }
Creating Stripe checkout session { userType: 'parent', planType: 'annual', ... }
Payment session created successfully { sessionId: 'cs_123', checkoutUrl: 'https://...' }
```

### Webhook Processing Logs

```
# Successful webhook
Webhook received from Stripe { sig: 'sig_123' }
Webhook event verified and constructed { eventType: 'checkout.session.completed', ... }
Processing checkout session completion { userId: '123', userType: 'parent', ... }
Creating new subscription { userId: '123' }
Subscription activated successfully { userId: '123' }
```

## Getting Help

If payment processing is still not working:

1. **Check Server Logs**
   - Look for "Stripe initialization failed" or "Error creating payment session"
   - Search for the error message

2. **Verify Environment Variables**
   - Confirm `.env` file exists in project root
   - Confirm keys are set and not empty

3. **Test Stripe Keys**
   - Log into Stripe dashboard
   - Verify API keys are valid and not revoked
   - If needed, create new keys

4. **Check Network**
   - Ensure server can reach Stripe API (api.stripe.com)
   - Check firewall/proxy settings if in corporate environment

5. **Review Recent Changes**
   - If payment was working, check what changed
   - Review `src/services/stripe-service.ts` and `src/routes/payments.ts`
   - Check for accidental environment variable changes
