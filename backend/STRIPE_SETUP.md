# Stripe Integration Setup Guide

## Overview

This backend implements secure Stripe payment processing for Doula Connect. The system validates Stripe configuration during server startup and gracefully handles missing configuration.

## Configuration

### Required Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...  # Your Stripe secret API key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret (required for production)
```

### Getting Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API Keys
3. Copy your Secret Key (starts with `sk_live_` or `sk_test_`)
4. For webhooks, go to Developers → Webhooks
5. Create an endpoint for your webhook URL
6. Copy the Signing Secret (starts with `whsec_`)

## Startup Initialization

When the server starts, it automatically:

1. **Validates Configuration**: Checks if `STRIPE_SECRET_KEY` is set
2. **Initializes Stripe Client**: Creates a Stripe client instance
3. **Checks Webhook Secret**: Warns if webhook secret is missing in production
4. **Logs Status**: Outputs initialization status to console

### Initialization Status Messages

| Status | Meaning | Impact |
|--------|---------|--------|
| ✓ Stripe initialized | All systems ready | Payments fully functional |
| ⚠ Missing API key | Configuration error | Payment endpoints return 503 |
| ⚠ Missing webhook secret | Production warning | Webhooks may not verify properly |

## API Endpoints

### Create Payment Session
```
POST /payments/create-session
Content-Type: application/json

{
  "userId": "user-uuid",
  "userType": "parent" | "doula",
  "planType": "annual" | "monthly",
  "email": "user@example.com"
}

Response (200 OK):
{
  "success": true,
  "sessionId": "cs_...",
  "clientSecret": "...",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_..."
}

Response (503 Service Unavailable):
{
  "error": "Payment processing is currently unavailable. Please try again later."
}
```

### Payment Webhook
```
POST /payments/webhook
Headers: stripe-signature: <signature>

Stripe sends:
- checkout.session.completed: When payment succeeds
- customer.subscription.deleted: When subscription is cancelled

Actions taken:
- Creates subscription record in database
- Updates profile subscription_active status
- Sets current_period_end to now + duration
```

### Get Subscription
```
GET /subscriptions/:userId

Response (200 OK):
{
  "id": "sub-uuid",
  "status": "active",
  "planType": "annual" | "monthly",
  "amount": "99.00",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2025-01-01T00:00:00Z"
}

Response (404 Not Found):
{
  "error": "Subscription not found"
}
```

### Health Check Endpoints

#### Application Status
```
GET /status

Response:
{
  "status": "healthy" | "degraded",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "ready",
    "stripe": {
      "initialized": true,
      "available": true,
      "error": null
    }
  }
}
```

#### Stripe Status
```
GET /status/stripe

Response:
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "Stripe payment processing is operational"
}
```

## Error Handling

### Missing Configuration

If `STRIPE_SECRET_KEY` is not set:
1. Server logs a warning during startup
2. Payment endpoints return 503 Service Unavailable
3. Health check shows Stripe as unavailable
4. Application continues running (graceful degradation)

### Webhook Verification Failures

If webhook signature verification fails:
1. Request returns 400 Bad Request
2. Event is logged as failed
3. Webhook remains unprocessed (Stripe will retry)

### Payment Processing Errors

If payment session creation fails:
1. Specific error message is logged
2. Client receives 500 Internal Server Error
3. User can retry the payment

## Pricing

### Parent Users
- Plan Type: Annual
- Amount: $99.00/year
- Duration: 365 days

### Doula Users
- Plan Type: Monthly
- Amount: $99.00/month
- Duration: 30 days

## Subscription Management

### Automatic Operations

When a payment succeeds:
1. Subscription record created/updated
2. User profile `subscription_active` set to true
3. `currentPeriodStart` set to now
4. `currentPeriodEnd` set to now + duration

When subscription is cancelled:
1. Subscription `status` set to 'cancelled'
2. User profile `subscription_active` set to false

## Testing

### With Test Keys

1. Set `STRIPE_SECRET_KEY=sk_test_...`
2. Use Stripe test card: `4242 4242 4242 4242`
3. Use any future expiration date
4. Payment will succeed without charging

### Without Stripe Configured

1. Leave `STRIPE_SECRET_KEY` unset
2. Server runs normally
3. Payment endpoints return 503 errors
4. Health check shows Stripe unavailable
5. Use this for development/testing without Stripe

## Monitoring

### Check Payment Status
```bash
curl http://localhost:8000/status/stripe
```

### Check Application Health
```bash
curl http://localhost:8000/status
```

## Production Checklist

- [ ] Set `STRIPE_SECRET_KEY` with live secret key
- [ ] Set `STRIPE_WEBHOOK_SECRET` with webhook signing secret
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Set `FRONTEND_URL` to production URL
- [ ] Test payment flow end-to-end
- [ ] Monitor webhook delivery in Stripe dashboard
- [ ] Set up alerts for failed payments
- [ ] Review subscription lifecycle management
- [ ] Test subscription cancellation flow

## Troubleshooting

### "Payment processing is currently unavailable"

**Cause**: `STRIPE_SECRET_KEY` is not set
**Solution**:
1. Set `STRIPE_SECRET_KEY` in environment
2. Restart server
3. Check `/status/stripe` endpoint

### "Webhook signature verification failed"

**Cause**: `STRIPE_WEBHOOK_SECRET` mismatch
**Solution**:
1. Copy correct webhook secret from Stripe dashboard
2. Update `STRIPE_WEBHOOK_SECRET`
3. Restart server

### Payments not processing

**Cause**: Multiple possible issues
**Debugging**:
1. Check `/status` endpoint
2. Check server logs for Stripe errors
3. Verify Stripe keys are set correctly
4. Check webhook delivery in Stripe dashboard

## Architecture

### Stripe Service (`src/services/stripe-service.ts`)

Centralized service for:
- Validating Stripe configuration
- Initializing Stripe client
- Tracking initialization state
- Providing status information

### Payment Routes (`src/routes/payments.ts`)

Endpoints for:
- Creating payment sessions
- Handling webhooks
- Managing subscriptions
- Updating subscription status

### Health Routes (`src/routes/health.ts`)

Endpoints for:
- Overall application status
- Stripe service status
- Service dependency monitoring

## Security Considerations

1. **API Key Security**: Store `STRIPE_SECRET_KEY` securely (never commit to Git)
2. **Webhook Verification**: All webhooks verified with `STRIPE_WEBHOOK_SECRET`
3. **Client Secret**: `clientSecret` provided only to authenticated users
4. **Sensitive Data**: Error messages don't expose Stripe configuration details
5. **HTTPS Required**: Webhook endpoint must use HTTPS in production

## Support

For issues with Stripe integration:
1. Check Stripe dashboard for transaction status
2. Review server logs for detailed error messages
3. Verify environment variables are set correctly
4. Contact Stripe support: support@stripe.com
