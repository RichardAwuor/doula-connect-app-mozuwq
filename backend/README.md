# Doula Connect Backend API

Complete backend API for the Doula Connect platform with user management, profile systems, matching, contracts, and **Stripe payment processing**.

## 🚀 Getting Started

```bash
npm install
npm run dev
```

## 📚 Documentation

**New to this project?** Start here:
- **[QUICK_START.md](./QUICK_START.md)** - 3-minute setup guide
- **[STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md)** - Complete Stripe configuration
- **[README_FIRST.md](./STRIPE_API_TESTING.md)** - API testing guide

**Troubleshooting?**
- [PAYMENT_TROUBLESHOOTING.md](./PAYMENT_TROUBLESHOOTING.md) - Common issues and fixes
- [STRIPE_CONFIGURATION_SUMMARY.md](./STRIPE_CONFIGURATION_SUMMARY.md) - Architecture overview

## 🎯 Key Features

### User Management
- ✅ OTP email verification
- ✅ Parent registration with preferences
- ✅ Doula registration with qualifications
- ✅ Profile management and updates

### Matching System
- ✅ Geographic matching (same state)
- ✅ Service category matching
- ✅ Language preference matching
- ✅ Payment method matching
- ✅ Subscription requirement checking

### Service Management
- ✅ Parent-Doula contracts
- ✅ Contract status tracking
- ✅ Service reviews and ratings
- ✅ Comment moderation

### Payment Processing ⭐
- ✅ Stripe Checkout integration
- ✅ Subscription billing (annual & monthly)
- ✅ Webhook handling
- ✅ Subscription management
- ✅ Health diagnostics

## 🔧 Setup (3 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your Stripe keys from https://dashboard.stripe.com/apikeys
```

### 3. Start Server
```bash
npm run dev
```

Verify Stripe is configured:
```bash
curl http://localhost:8000/status/stripe
```

## 🗄️ Database

Uses Neon PostgreSQL (Postgres) with Drizzle ORM.

**After editing `src/db/schema.ts`, push changes:**
```bash
npm run db:push
```

**Or run steps separately:**
```bash
npm run db:generate    # Generate migrations
npm run db:migrate     # Apply migrations
npm run db:studio      # View database GUI
```

## 📊 API Endpoints

### Payment Processing ⭐
```
POST   /payments/create-session    Create Stripe checkout session
POST   /payments/webhook           Handle Stripe webhook events
GET    /subscriptions/:userId      Get subscription status
PUT    /subscriptions/:userId      Update subscription status
GET    /status/stripe              Check Stripe configuration
```

### Authentication
```
POST   /auth/send-otp              Send OTP to email
POST   /auth/verify-otp            Verify OTP code
POST   /auth/register-parent       Register parent
POST   /auth/register-doula        Register doula
```

### Profiles
```
GET    /parents/:userId            Get parent profile
PUT    /parents/:userId            Update parent profile
GET    /doulas/:userId             Get doula profile
PUT    /doulas/:userId             Update doula profile
```

### Matching
```
GET    /matching/doulas/:userId    Find matching doulas
GET    /matching/parents/:userId   Find matching parents
```

### Contracts & Reviews
```
POST   /contracts                  Create contract
GET    /contracts/:contractId      Get contract
GET    /users/:userId/contracts    Get user's contracts
PUT    /contracts/:contractId      Update contract
POST   /comments                   Create review
GET    /doulas/:doulaId/comments   Get doula reviews
```

## 💰 Payment Configuration

### Quick Setup
1. Get Stripe keys: https://dashboard.stripe.com/apikeys
2. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_key
   ```
3. Restart server
4. Test: `curl http://localhost:8000/status/stripe`

### Supported Plans
- **Parent Annual** - $99.00/year
- **Doula Monthly** - $99.00/month

### Features
- Stripe Checkout integration
- Subscription-based billing
- Automatic renewal intervals
- Webhook verification
- Subscription tracking

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/status       # Overall status
curl http://localhost:8000/status/stripe # Stripe status
```

### Payment Test
```bash
curl -X POST http://localhost:8000/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-123",
    "userType": "parent",
    "planType": "annual",
    "email": "test@example.com"
  }'
```

### Test Cards
Use these with any future expiry and any 3-digit CVC:
- **4242 4242 4242 4242** - Successful payment
- **4000 0000 0000 0002** - Declined card

## 📦 Tech Stack

- **Framework**: Fastify
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Payment**: Stripe
- **Email**: Resend
- **Language**: TypeScript
- **Runtime**: Node.js

## 🗂️ Project Structure

```
src/
├── index.ts                      # Server entry point
├── db/
│   └── schema.ts                 # Database schema
├── services/
│   └── stripe-service.ts         # Stripe client management
└── routes/
    ├── auth.ts                   # User registration
    ├── email-otp.ts              # OTP verification
    ├── parent-profiles.ts        # Parent profiles
    ├── doula-profiles.ts         # Doula profiles
    ├── matching.ts               # Matching system
    ├── contracts.ts              # Service contracts
    ├── comments.ts               # Reviews
    ├── payments.ts               # Payment processing ⭐
    └── health.ts                 # Health checks ⭐
```

## 🔐 Environment Variables

### Required
```env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
```

### Recommended
```env
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Optional
```env
RESEND_API_KEY=re_...
RESEND_FROM=noreply@doulaconnect.com
```

See `.env.template` for detailed descriptions.

## 🚀 Production Deployment

Before deploying:
- [ ] Use live Stripe keys (`sk_live_...`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Set all required secrets in deployment environment
- [ ] Test payment flow
- [ ] Monitor logs for errors

## 📞 Support

**Payment not working?**
1. Check `.env` file for `STRIPE_SECRET_KEY`
2. Verify with: `curl http://localhost:8000/status/stripe`
3. Check server logs for error messages
4. See [PAYMENT_TROUBLESHOOTING.md](./PAYMENT_TROUBLESHOOTING.md)

**Need help?**
1. Check relevant documentation files
2. Review server logs
3. Test with status endpoints
4. Verify environment variables

## 📄 Documentation Files

| File | Purpose |
|---|---|
| QUICK_START.md | 3-minute quick start |
| STRIPE_SETUP_GUIDE.md | Complete setup instructions |
| STRIPE_API_TESTING.md | API endpoint testing |
| PAYMENT_TROUBLESHOOTING.md | Troubleshooting guide |
| STRIPE_CONFIGURATION_SUMMARY.md | Architecture overview |
| IMPLEMENTATION_VERIFICATION.md | What's implemented |
| STRIPE_INTEGRATION_COMPLETE.md | Integration summary |
| .env.template | Detailed configuration |

---

**Ready to process payments?** Start with [QUICK_START.md](./QUICK_START.md)
