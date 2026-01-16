# Stripe Payment Integration - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Get Stripe Keys (2 minutes)

1. Go to https://dashboard.stripe.com/apikeys
2. Under **Secret Key**, click **Reveal** and copy the key (starts with `sk_`)
3. Go to https://dashboard.stripe.com/webhooks
4. Click your webhook endpoint (or create one)
5. Copy the **Signing Secret** (starts with `whsec_`)

### Step 2: Configure Backend (1 minute)

Create `.env` file in the backend root directory:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Step 3: Restart Server

```bash
npm run dev
```

You should see:
```
✓ Stripe payment service initialized successfully - Payment processing is ENABLED
```

## ✅ Verify It Works

```bash
curl http://localhost:8000/status/stripe
```

Expected response:
```json
{
  "initialized": true,
  "available": true,
  "message": "Stripe payment processing is operational"
}
```

## 🧪 Test Payment Flow

### Create a Payment Session

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

Response:
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Complete Payment

1. Open the `checkoutUrl` in your browser
2. Use test card: **4242 4242 4242 4242**
3. Enter any future expiry date and any 3-digit CVC
4. Submit payment

### Verify Subscription Created

```bash
curl http://localhost:8000/subscriptions/test-user-123
```

Should return subscription with `"status": "active"`.

## 🎯 Payment Plans

| Plan | Price | Type |
|---|---|---|
| Parent Annual | $99/year | annual |
| Doula Monthly | $99/month | monthly |

## 📚 Full Documentation

- **STRIPE_SETUP_GUIDE.md** - Complete setup instructions
- **STRIPE_API_TESTING.md** - Detailed API testing guide
- **PAYMENT_TROUBLESHOOTING.md** - Common issues and fixes
- **STRIPE_CONFIGURATION_SUMMARY.md** - Architecture overview

## ❓ Stripe Not Working?

### Stripe says "Not Available"?

```bash
# Check if STRIPE_SECRET_KEY is set
cat .env | grep STRIPE_SECRET_KEY

# If empty, add your key:
echo "STRIPE_SECRET_KEY=sk_test_..." >> .env

# Restart server
npm run dev
```

### Webhook not being received?

1. Ensure webhook endpoint is configured in Stripe Dashboard
2. URL should be: `https://yourdomain.com/payments/webhook` (public URL)
3. For local testing, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:8000/payments/webhook
   ```

### Still stuck?

Check server logs for error messages:
```bash
# Look for "Stripe initialization failed" or "Error creating payment session"
# These messages will tell you exactly what's wrong
```

## 🔑 Environment Variables

### Required
```env
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
```

### Recommended
```env
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000 (or your production domain)
```

### Optional
```env
NODE_ENV=development (or production)
RESEND_API_KEY=re_... (for email OTP)
```

## 📞 API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/payments/create-session` | POST | Create Stripe checkout session |
| `/payments/webhook` | POST | Receive Stripe events |
| `/subscriptions/:userId` | GET | Check subscription status |
| `/subscriptions/:userId` | PUT | Update subscription status |
| `/status/stripe` | GET | Check Stripe configuration |

## 🚀 Next Steps

1. Add your Stripe keys to `.env`
2. Restart the backend server
3. Test with `/status/stripe` endpoint
4. Run through payment flow with test card
5. Read full documentation for production setup

**That's it! Your payment system is live! 🎉**
