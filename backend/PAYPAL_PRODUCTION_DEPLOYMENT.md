# PayPal Payment Processing - Production Deployment Guide

## ✅ Ready for Production

The PayPal payment processing integration is **production-ready** and fully tested.

---

## Pre-Deployment Checklist

### 1. Verify PayPal Account ✅
- [ ] PayPal Business account created
- [ ] Account verified and active
- [ ] Tax information submitted (if required)
- [ ] Bank account linked for fund transfers

### 2. Get Production Credentials ✅
- [ ] Log into [PayPal Live Dashboard](https://www.paypal.com/mep/dashboard)
- [ ] Navigate to Apps & Credentials
- [ ] Switch to **Live** tab
- [ ] Copy Live **Client ID**
- [ ] Copy Live **Secret**
- [ ] Create webhook in Live environment
- [ ] Copy **Webhook ID**

### 3. Configure Environment Variables ✅

**Production .env File:**
```env
# PayPal Production Configuration
NODE_ENV=production
PAYPAL_CLIENT_ID=APP-your_live_client_id_here
PAYPAL_CLIENT_SECRET=your_live_client_secret_here
PAYPAL_WEBHOOK_ID=your_live_webhook_id_here

# Frontend Configuration
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://your_db_url

# Email (optional)
RESEND_API_KEY=your_resend_key
RESEND_FROM=noreply@yourdomain.com
```

### 4. Test Before Deploying ✅

**Test in Staging:**
```bash
# Deploy to staging first
NODE_ENV=production npm run build
npm start

# Verify PayPal status
curl https://staging.yourdomain.com/status/paypal

# Expected:
# {
#   "initialized": true,
#   "available": true,
#   "message": "PayPal payment processing is operational"
# }

# Test creating an order
curl -X POST https://staging.yourdomain.com/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "userType": "parent",
    "planType": "annual",
    "email": "test@example.com"
  }'

# Should return 200 with orderId and approvalUrl
```

### 5. Configure Webhook ✅

**In PayPal Live Dashboard:**

1. Go to **Webhooks**
2. Click **Create Webhook**
3. Enter webhook URL:
   ```
   https://yourdomain.com/payments/webhook
   ```
4. Select events:
   - ✅ `CHECKOUT.ORDER.APPROVED`
   - ✅ `CHECKOUT.ORDER.COMPLETED`
   - ✅ `BILLING.SUBSCRIPTION.CANCELLED`
5. Click **Create Webhook**
6. Copy the **Webhook ID**
7. Add to production `.env`:
   ```env
   PAYPAL_WEBHOOK_ID=your_webhook_id
   ```

### 6. Database Migration ✅

**Ensure subscriptions table exists with PayPal fields:**
```bash
npm run db:push
```

**Verify schema includes:**
- ✅ `paypal_customer_id`
- ✅ `paypal_order_id`
- ✅ `paypal_subscription_id`

---

## Deployment Steps

### Step 1: Build for Production

```bash
# Build the project
npm run build

# Verify build succeeded
ls -la dist/

# Should show: index.js with production build
```

### Step 2: Set Environment Variables

**On hosting platform (Vercel, AWS, Heroku, etc.):**

```
PAYPAL_CLIENT_ID=APP-your_live_id
PAYPAL_CLIENT_SECRET=your_live_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=your_database_url
```

### Step 3: Deploy Application

```bash
# Deploy using your platform's method
# Examples:

# Vercel
vercel deploy --prod

# AWS Lambda
sam deploy --guided

# Heroku
git push heroku main

# Docker
docker build -t my-app .
docker run -e PAYPAL_CLIENT_ID=... -e PAYPAL_CLIENT_SECRET=... my-app
```

### Step 4: Verify Deployment

```bash
# Test PayPal status
curl https://yourdomain.com/status/paypal

# Expected: available: true

# Test creating order
curl -X POST https://yourdomain.com/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "prod-test-123",
    "userType": "parent",
    "planType": "annual",
    "email": "test@yourdomain.com"
  }'

# Expected: 200 with orderId and approvalUrl
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check PayPal is still available
curl https://yourdomain.com/status/paypal

# Monitor logs for errors
tail -f logs/application.log | grep -i paypal
```

### Weekly Reviews

- [ ] Check PayPal webhook event logs in dashboard
- [ ] Review failed payment logs
- [ ] Verify subscription counts are growing
- [ ] Check for any API errors

### Monthly Audits

- [ ] Review all payment transactions in PayPal dashboard
- [ ] Reconcile with database subscription records
- [ ] Check for any suspicious activities
- [ ] Review error logs and fix any issues

---

## Error Handling & Recovery

### Common Issues

#### Issue: "PayPal credentials not configured"

**Cause:** Environment variables not set
**Solution:**
1. Verify `.env` file has all variables
2. Restart application
3. Check logs: `curl /status/paypal`

#### Issue: "Webhook not received"

**Cause:** Webhook URL not accessible
**Solution:**
1. Verify HTTPS is enabled (production requirement)
2. Check webhook URL is correct in PayPal dashboard
3. Test with Webhook Simulator in PayPal dashboard
4. Check firewall/security group allows HTTPS 443

#### Issue: "Payment order creation fails"

**Cause:** PayPal API error
**Solution:**
1. Check server logs for error details
2. Verify PayPal account is in good standing
3. Check daily API limits haven't been exceeded
4. Retry the payment

### Troubleshooting Commands

```bash
# Check application is running
curl https://yourdomain.com/status

# Check PayPal configuration
curl https://yourdomain.com/status/paypal

# Check server logs
ssh user@server
tail -f /var/log/app/app.log

# Test payment creation
curl -X POST https://yourdomain.com/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-123",
    "userType": "parent",
    "planType": "annual",
    "email": "test@example.com"
  }'
```

---

## Security Best Practices

### 1. Credential Management ✅

```
✅ NEVER commit credentials to git
✅ Use environment variables only
✅ Rotate credentials regularly
✅ Use separate credentials for each environment
✅ Store credentials in secure vault (AWS Secrets Manager, etc.)
```

### 2. HTTPS Requirement ✅

```
✅ All endpoints must be HTTPS
✅ Webhook URLs must be HTTPS
✅ Valid SSL certificate required
✅ Redirect HTTP to HTTPS
```

### 3. Webhook Verification ✅

```
✅ Verify webhook signature (implemented)
✅ Use webhook ID for validation (implemented)
✅ Log all webhook events
✅ Retry failed webhooks
```

### 4. Data Protection ✅

```
✅ Encrypt PayPal credentials in transit
✅ Use parameterized database queries
✅ Validate all inputs
✅ Don't log sensitive data (credit cards, etc.)
```

---

## Rollback Plan

### If Payment Processing Fails

**Immediate Actions:**
1. Check `/status/paypal` endpoint
2. Verify credentials are correct
3. Check PayPal service status
4. Review server logs

**If Cannot Recover Quickly:**
1. Deploy previous version: `git revert HEAD`
2. Update DNS to point to backup
3. Notify users of issue
4. Investigate root cause

**Recovery Steps:**
1. Fix the issue
2. Test in staging
3. Deploy to production
4. Verify all payments working
5. Resume normal operations

---

## Performance Optimization

### Response Times

```
Expected:
- POST /payments/create-session: < 500ms
- GET /status/paypal: < 100ms
- POST /payments/webhook: < 1000ms

Monitor:
- curl https://yourdomain.com/payments/create-session \
  -w "\nTotal: %{time_total}s\n"
```

### Database Optimization

```sql
-- Verify indexes exist
SELECT * FROM pg_stat_user_indexes
WHERE tablename = 'subscriptions';

-- Should show indexes on:
-- - subscription_user_id_idx
-- - subscription_status_idx
```

### Caching

```
- Subscription lookups: Cache 5 min
- PayPal status: Cache 1 min
- Configuration: Cache at startup
```

---

## Scaling Considerations

### For High Volume

1. **Database:**
   - Add read replicas
   - Optimize indexes
   - Archive old records

2. **PayPal API:**
   - Implement request batching
   - Add retry logic with exponential backoff
   - Monitor rate limits

3. **Infrastructure:**
   - Use load balancer
   - Scale horizontally
   - Add caching layer

---

## Documentation & Support

### Resources

- [PayPal Production Guide](https://developer.paypal.com/docs)
- [PayPal API Reference](https://developer.paypal.com/docs/api)
- [PayPal Webhooks](https://developer.paypal.com/docs/api/webhooks)
- Server logs and error messages

### Getting Help

1. Check `/status/paypal` for service status
2. Review server logs for errors
3. Check PayPal dashboard for webhook events
4. Consult PayPal developer support

---

## Deployment Verification Checklist

- [ ] Environment variables configured
- [ ] Database migrated (PayPal fields present)
- [ ] Build completed successfully
- [ ] Application started without errors
- [ ] `/status/paypal` returns available: true
- [ ] Test payment can be created
- [ ] Webhook configured in PayPal dashboard
- [ ] HTTPS enabled and certificates valid
- [ ] DNS properly configured
- [ ] Monitoring and logging in place
- [ ] Backup plan documented
- [ ] Team trained on payment system

---

## Summary

✅ **Ready for Production Deployment**

All requirements met:
- ✅ PayPal integration complete
- ✅ Error handling comprehensive
- ✅ Configuration flexible
- ✅ Pricing correct
- ✅ Workflow end-to-end
- ✅ Logging detailed
- ✅ Security best practices

**Deploy with confidence!**
