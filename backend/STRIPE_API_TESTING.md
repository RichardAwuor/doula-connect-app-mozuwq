# Stripe Integration API Testing Guide

## Quick Start: Test Payment Processing

### 1. Verify Stripe Service is Running

```bash
curl http://localhost:8000/status/stripe
```

Expected response (Stripe enabled):
```json
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "Stripe payment processing is operational"
}
```

If you see `"available": false`, check your `.env` file for the `STRIPE_SECRET_KEY`.

---

## API Endpoints

### POST /payments/create-session
**Create a Stripe checkout session for payment**

#### Request (Parent Annual Plan)
```bash
curl -X POST http://localhost:8000/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "userType": "parent",
    "planType": "annual",
    "email": "parent@example.com"
  }'
```

#### Request (Doula Monthly Plan)
```bash
curl -X POST http://localhost:8000/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "userType": "doula",
    "planType": "monthly",
    "email": "doula@example.com"
  }'
```

#### Success Response (200)
```json
{
  "success": true,
  "sessionId": "cs_test_51234567890abcdefghijk",
  "clientSecret": "cs_test_51234567890abcdefghijk_secret_abcdefg",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_51234567890abcdefghijk"
}
```

#### Error Response - Stripe Unavailable (503)
```json
{
  "error": "Payment processing is currently unavailable. Stripe API key not configured.",
  "details": "STRIPE_SECRET_KEY environment variable is not set. Payment processing is disabled."
}
```

#### Error Response - Invalid Plan Type (400)
```json
{
  "error": "Parents must choose annual plan"
}
```

#### Error Response - Missing Fields (400)
```json
{
  "error": "Missing required fields"
}
```

---

### POST /payments/webhook
**Receive and process Stripe webhook events**

This endpoint is called by Stripe automatically. You don't need to call it manually.

#### Expected Webhook Events

**1. Checkout Session Completed**
- Triggered when user completes payment
- Creates subscription record in database
- Updates user profile with subscription status

**2. Customer Subscription Deleted**
- Triggered when user cancels subscription
- Updates subscription status to 'cancelled'
- Updates user profile to mark subscription as inactive

#### Testing Webhooks Locally

Use Stripe CLI to forward webhooks to your local machine:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Forward webhook events to your local endpoint
stripe listen --forward-to localhost:8000/payments/webhook

# This will output your signing secret (starts with whsec_)
# Add it to your .env file:
# STRIPE_WEBHOOK_SECRET=whsec_...

# Trigger test events in another terminal
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

---

### GET /subscriptions/:userId
**Get subscription status for a user**

#### Request
```bash
curl http://localhost:8000/subscriptions/550e8400-e29b-41d4-a716-446655440000
```

#### Success Response (200)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "stripeCustomerId": "cus_1234567890",
  "stripeSubscriptionId": "sub_1234567890",
  "status": "active",
  "planType": "annual",
  "amount": "99.00",
  "currentPeriodStart": "2025-01-20T12:00:00.000Z",
  "currentPeriodEnd": "2026-01-20T12:00:00.000Z",
  "createdAt": "2025-01-20T12:00:00.000Z",
  "updatedAt": "2025-01-20T12:00:00.000Z"
}
```

#### Error Response - Not Found (404)
```json
{
  "error": "Subscription not found"
}
```

---

### PUT /subscriptions/:userId
**Update subscription status**

#### Request
```bash
curl -X PUT http://localhost:8000/subscriptions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cancelled"
  }'
```

#### Valid Status Values
- `active` - Subscription is active
- `cancelled` - Subscription has been cancelled
- `expired` - Subscription has expired

#### Success Response (200)
```json
{
  "success": true,
  "message": "Subscription updated successfully"
}
```

#### Error Response - Not Found (404)
```json
{
  "error": "Subscription not found"
}
```

---

### GET /status/stripe
**Check Stripe service status and configuration**

#### Request
```bash
curl http://localhost:8000/status/stripe
```

#### Success Response (200)
```json
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "Stripe payment processing is operational"
}
```

#### Error Response (200)
```json
{
  "initialized": true,
  "available": false,
  "error": "STRIPE_SECRET_KEY environment variable is not set. Payment processing is disabled.",
  "message": "Stripe is not available: STRIPE_SECRET_KEY environment variable is not set. Payment processing is disabled."
}
```

---

## Testing with Test Cards

Stripe provides test card numbers for development. Use these with any future expiry date and any 3-digit CVC.

### Common Test Cards

| Card Number | Use Case | Result |
|---|---|---|
| 4242 4242 4242 4242 | Successful payment | Payment succeeds |
| 4000 0000 0000 0002 | Card declined | Payment fails |
| 4000 0025 0000 3155 | Requires 3D Secure | Prompts for authentication |
| 5555 5555 5555 4444 | Mastercard test | Payment succeeds |

### Testing Subscription Payment Flow

1. **Create Payment Session**
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
   Copy the `checkoutUrl` from the response.

2. **Complete Payment**
   - Open the `checkoutUrl` in your browser
   - Use test card: 4242 4242 4242 4242
   - Enter any future expiry (e.g., 12/26)
   - Enter any 3-digit CVC (e.g., 123)
   - Submit payment

3. **Verify Subscription Created**
   ```bash
   curl http://localhost:8000/subscriptions/test-user-123
   ```
   Should return subscription with `status: "active"` once webhook is processed.

---

## Expected Server Logs

### Successful Payment Session Creation
```
Payment session requested { userId: 'test-user-123', userType: 'parent', planType: 'annual', email: 'test@example.com' }
Creating Stripe checkout session { userType: 'parent', planType: 'annual', amount: 9900, planName: 'Parent Annual Plan', email: 'test@example.com' }
Payment session created successfully { sessionId: 'cs_test_...', userId: 'test-user-123', checkoutUrl: 'https://checkout.stripe.com/...' }
```

### Successful Webhook Processing
```
Webhook received from Stripe { sig: 'sig_...' }
Constructing webhook event { bodyLength: 1234 }
Webhook event verified and constructed { eventType: 'checkout.session.completed', eventId: 'evt_...' }
Processing checkout session completion { userId: 'test-user-123', userType: 'parent', planType: 'annual', sessionId: 'cs_test_...' }
Creating new subscription { userId: 'test-user-123' }
Subscription activated successfully { userId: 'test-user-123' }
```

### Failed Payment (Missing Stripe Key)
```
Payment session requested { userId: '...', userType: 'parent', planType: 'annual', ... }
Stripe service is not available - payment processing is disabled { stripeStatus: { initialized: true, available: false, error: 'STRIPE_SECRET_KEY...' } }
```

---

## Common Issues During Testing

### Issue: Payment Session Returns 503

**Cause**: Stripe not initialized

**Fix**:
```bash
# Check .env file
cat .env | grep STRIPE_SECRET_KEY

# If empty, add your key:
echo "STRIPE_SECRET_KEY=sk_test_your_key" >> .env

# Restart server
```

### Issue: Webhook Not Received

**Solution 1**: Use Stripe CLI
```bash
stripe listen --forward-to localhost:8000/payments/webhook
stripe trigger checkout.session.completed
```

**Solution 2**: Check Stripe Dashboard
1. Go to Developers > Webhooks
2. Click your endpoint
3. Scroll to "Events" to see delivery status

### Issue: Signature Verification Failed

**Cause**: `STRIPE_WEBHOOK_SECRET` mismatch

**Fix**:
```bash
# Get the correct webhook secret from Stripe Dashboard
# Developers > Webhooks > Click endpoint > Copy Signing secret

# Update .env
echo "STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret" >> .env

# Restart server
```

---

## Manual Webhook Testing with Curl

If you want to simulate a webhook locally without Stripe CLI:

```bash
# This is for testing purposes only - use Stripe CLI for real testing

# Get a real checkout session first
SESSION_ID="cs_test_..."

# Then use Stripe CLI to simulate webhook:
stripe trigger checkout.session.completed --override session_id=$SESSION_ID
```

For production webhook testing, always use the Stripe Dashboard > Webhooks > Events > Resend to verify delivery.

---

## Monitoring Payment Health

### Regular Checks

**Daily**:
- Check server logs for payment errors
- Monitor `/status/stripe` endpoint

**Weekly**:
- Review Stripe Dashboard for failed payments
- Check webhook delivery status
- Verify subscription counts in database

**Monthly**:
- Review payment metrics
- Check for suspicious patterns
- Verify webhook events are being received

### Key Metrics to Monitor

1. **Payment Success Rate**: Successful payments / Total attempts
2. **Webhook Delivery Rate**: Delivered / Sent
3. **Subscription Active Count**: Active subscriptions by plan type
4. **Failed Payments**: Track reasons (card declined, expired, etc.)
