# Stripe Setup and Configuration Guide

## Overview

This guide explains how to configure the Doula Connect backend with your Stripe API credentials for payment processing.

## Step 1: Obtain Your Stripe API Keys

### Get Your Secret API Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** in the left sidebar
3. Click **API Keys**
4. You'll see two keys:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
5. Copy the **Secret Key** (this is what you need)

### Choose Between Test and Live Keys

- **Test Keys**: For development and testing (starts with `sk_test_`)
- **Live Keys**: For production (starts with `sk_live_`)

### Example Keys Format

```
Test Secret Key:  sk_test_51234567890abcdefghijk
Live Secret Key:  sk_live_98765432109876543210fe
```

## Step 2: Configure Environment Variables

### Create or Update `.env` File

Create a `.env` file in the backend root directory (same level as `package.json`):

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/doulaconnect

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Service Configuration (Resend)
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM=noreply@doulaconnect.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

### Security Best Practices

⚠️ **IMPORTANT**: Never commit your `.env` file to version control!

1. Add `.env` to `.gitignore` if not already present:
   ```bash
   echo ".env" >> .gitignore
   ```

2. Store secrets securely:
   - Use your hosting provider's secrets manager (AWS Secrets Manager, Vercel Secrets, etc.)
   - Never paste keys into commit messages or pull requests
   - Rotate keys regularly

## Step 3: Verify Configuration

### Check Server Startup Logs

After restarting the server, you should see:

```
Initializing Stripe payment service...
Stripe client successfully initialized with API key
✓ Stripe payment service initialized successfully - Payment processing is ENABLED
```

### Test Stripe Health Endpoint

```bash
curl http://localhost:8000/status/stripe
```

**Expected Response:**
```json
{
  "initialized": true,
  "available": true,
  "error": null,
  "message": "Stripe payment processing is operational"
}
```

## Step 4: Configure Webhooks (Production)

### Create Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** > **Webhooks**
3. Click **Add endpoint**
4. Enter your webhook URL:
   ```
   https://yourdomain.com/payments/webhook
   ```
5. Select events to listen for:
   - ✓ `checkout.session.completed`
   - ✓ `customer.subscription.deleted`
6. Click **Add endpoint**

### Get Webhook Secret

1. Click the endpoint you just created
2. Scroll to **Signing secret**
3. Click **Reveal**
4. Copy the signing secret (starts with `whsec_`)

### Update `.env` with Webhook Secret

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

## Step 5: Test Payment Processing

### 1. Create a Payment Session

```bash
curl -X POST http://localhost:8000/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-12345",
    "userType": "parent",
    "planType": "annual",
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "clientSecret": "...",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### 2. Use Test Cards (Development Only)

Stripe provides test card numbers for development:

| Card Number | CVC | Expiry | Use Case |
|---|---|---|---|
| 4242 4242 4242 4242 | Any 3 digits | Any future date | Successful payment |
| 4000 0000 0000 0002 | Any 3 digits | Any future date | Payment declined |
| 4000 0025 0000 3155 | Any 3 digits | Any future date | Requires authentication |

### 3. Monitor Webhook Events

1. Go to **Developers** > **Webhooks**
2. Click your endpoint
3. Scroll to **Events**
4. You should see `checkout.session.completed` events listed

## Step 6: Configuration for Different Environments

### Development Environment

```env
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
FRONTEND_URL=http://localhost:3000
```

### Production Environment

```env
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
FRONTEND_URL=https://yourdomain.com
```

### Testing/Staging Environment

```env
NODE_ENV=staging
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
FRONTEND_URL=https://staging.yourdomain.com
```

## Pricing Configuration

The backend is configured with the following pricing:

### Parent Plans
- **Annual Plan**: $99.00/year
- Plan Type: `annual`

### Doula Plans
- **Monthly Plan**: $99.00/month
- Plan Type: `monthly`

Prices are defined as cents in `src/routes/payments.ts`:
```typescript
const PARENT_ANNUAL_PRICE = 9900;    // $99.00
const DOULA_MONTHLY_PRICE = 9900;   // $99.00
```

To change pricing:
1. Edit `src/routes/payments.ts`
2. Update `PARENT_ANNUAL_PRICE` and/or `DOULA_MONTHLY_PRICE`
3. Restart the server
4. Update Stripe dashboard if needed

## Payment Flow Details

### 1. User Initiates Payment

Frontend calls: `POST /payments/create-session`

```json
{
  "userId": "uuid",
  "userType": "parent",    // or "doula"
  "planType": "annual",     // "annual" for parent, "monthly" for doula
  "email": "user@example.com"
}
```

### 2. Backend Creates Stripe Session

- Validates Stripe is available
- Validates plan type matches user type
- Creates Stripe checkout session
- Returns checkout URL to frontend

### 3. User Completes Payment in Stripe

- User enters card details
- Stripe processes payment
- Stripe sends webhook to your server

### 4. Backend Processes Webhook

- Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
- Creates subscription record in database
- Updates user profile with subscription status
- Returns success to Stripe

### 5. User Subscription is Active

- Database has subscription record
- User can access paid features
- Subscription can be cancelled via webhook

## Troubleshooting

### Payment Endpoint Returns 503

**Cause**: Stripe not initialized

**Solution**:
1. Check server logs for: "Stripe initialization failed"
2. Verify `STRIPE_SECRET_KEY` is set in `.env`
3. Verify key starts with `sk_test_` or `sk_live_`
4. Restart server

### Webhooks Not Being Received

**Cause 1**: Webhook endpoint not configured
- Solution: Follow Step 4 above

**Cause 2**: Webhook secret mismatch
- Solution: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

**Cause 3**: Endpoint not publicly accessible
- Solution: Ensure webhook URL is reachable from the internet

### Payment Session Creation Fails

**Check**:
1. `userId` is a valid UUID
2. `userType` is "parent" or "doula"
3. `planType` matches user type (parent → annual, doula → monthly)
4. `email` is valid

### Subscription Not Created After Payment

**Check**:
1. Webhooks are being received (check Stripe dashboard)
2. Webhook signature verification succeeding
3. Database has subscriptions table
4. Server logs show "Subscription activated successfully"

## API Endpoints Summary

### Create Payment Session
```
POST /payments/create-session
Body: { userId, userType, planType, email }
Response: { success, sessionId, checkoutUrl }
```

### Handle Webhook
```
POST /payments/webhook
Header: stripe-signature
Body: Raw Stripe event
Response: { received: true }
```

### Get Subscription Status
```
GET /subscriptions/:userId
Response: { id, userId, status, planType, amount, ... }
```

### Update Subscription Status
```
PUT /subscriptions/:userId
Body: { status: 'active'|'cancelled'|'expired' }
Response: { success, message }
```

### Check Stripe Status
```
GET /status/stripe
Response: { initialized, available, error, message }
```

## Production Deployment Checklist

- [ ] Using live Stripe keys (`sk_live_...`)
- [ ] `STRIPE_SECRET_KEY` set in production environment
- [ ] `STRIPE_WEBHOOK_SECRET` set in production environment
- [ ] Webhook endpoint configured in Stripe dashboard
- [ ] Webhook endpoint is HTTPS
- [ ] Webhook endpoint is publicly accessible
- [ ] `FRONTEND_URL` points to production domain
- [ ] Database has subscriptions table with proper schema
- [ ] Server logs show successful Stripe initialization
- [ ] `/status/stripe` endpoint returns `available: true`
- [ ] Test payment flow with real card (or Stripe test card)
- [ ] Verify webhook events are received in Stripe dashboard
- [ ] Monitor logs for payment processing errors
- [ ] Set up alerts for webhook failures

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhook Events](https://stripe.com/docs/api/events/types)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
