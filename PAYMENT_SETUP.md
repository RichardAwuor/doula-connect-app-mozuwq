
# Payment Integration Setup Guide

This guide explains how to configure and test the payment system for Doula Connect.

## Overview

The app supports three payment methods:
1. **Apple In-App Purchase** (iOS only)
2. **Google Play Billing** (Android only)
3. **PayPal** (Web and Mobile)

## Payment Flow

### For New Parents (Annual Subscription - $99/year)
1. User completes registration
2. Redirected to payment screen
3. Chooses payment method (IAP or PayPal)
4. Completes payment
5. Backend verifies and activates subscription
6. User gains access to Connect screen

### For Doulas (Monthly Subscription - $99/month)
Same flow as parents, but with monthly billing cycle.

## Configuration

### 1. iOS In-App Purchases (App Store Connect)

**Required Steps:**
1. Create App Store Connect account
2. Set up app in App Store Connect
3. Create in-app purchase products:
   - Product ID: `com.doulaconnect.parent.annual`
   - Type: Auto-Renewable Subscription
   - Price: $99.00 USD
   - Duration: 1 Year
   
   - Product ID: `com.doulaconnect.doula.monthly`
   - Type: Auto-Renewable Subscription
   - Price: $99.00 USD
   - Duration: 1 Month

4. Set up subscription groups
5. Configure App Store Server Notifications (webhooks)

**Environment Variables (Backend):**
```bash
APPLE_SHARED_SECRET=your_app_store_shared_secret
```

**Testing:**
- Use sandbox environment for testing
- Create sandbox test accounts in App Store Connect
- Test purchases won't charge real money

### 2. Android In-App Purchases (Google Play Console)

**Required Steps:**
1. Create Google Play Console account
2. Set up app in Google Play Console
3. Create subscription products:
   - Product ID: `com.doulaconnect.parent.annual`
   - Type: Subscription
   - Price: $99.00 USD
   - Billing Period: Yearly
   
   - Product ID: `com.doulaconnect.doula.monthly`
   - Type: Subscription
   - Price: $99.00 USD
   - Billing Period: Monthly

4. Set up Google Play Billing Library
5. Configure Real-time Developer Notifications (webhooks)

**Environment Variables (Backend):**
```bash
GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_json_key
```

**Testing:**
- Use test tracks (internal/closed/open testing)
- Add test accounts in Google Play Console
- Test purchases won't charge real money

### 3. PayPal Integration

**Required Steps:**
1. Create PayPal Business account
2. Create REST API app in PayPal Developer Dashboard
3. Get Client ID and Secret
4. Configure webhooks for subscription events

**Environment Variables (Backend):**
```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
NODE_ENV=production  # or 'development' for sandbox
```

**Webhook Events to Subscribe:**
- `CHECKOUT.ORDER.APPROVED`
- `CHECKOUT.ORDER.COMPLETED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.EXPIRED`

**Testing:**
- Use PayPal Sandbox for testing
- Create sandbox test accounts
- Test payments won't charge real money

## Backend Endpoints

### Payment Endpoints

1. **POST /api/payments/create-session**
   - Creates PayPal payment session
   - Body: `{ userId, userType, planType, email }`
   - Returns: `{ success, orderId, approvalUrl }`

2. **POST /api/payments/verify-iap**
   - Verifies iOS/Android in-app purchase
   - Body: `{ userId, receipt, platform, productId }`
   - Returns: `{ success, subscriptionId, expiresAt }`

3. **POST /api/payments/restore-purchases**
   - Restores previous purchases
   - Body: `{ userId, platform }`
   - Returns: `{ success, hasActiveSubscription, subscription }`

4. **GET /api/payments/subscription-status/:userId**
   - Gets current subscription status
   - Returns: `{ subscription: { status, planType, currentPeriodEnd, platform, autoRenew } }`

5. **POST /api/payments/webhook**
   - Handles PayPal webhook events
   - Automatically activates/deactivates subscriptions

## Frontend Implementation

### Payment Screen
- **Web**: `app/payment.tsx` - Shows PayPal option
- **Native**: `app/payment.native.tsx` - Shows IAP and PayPal options

### Payment Success/Cancelled
- `app/payment-success.tsx` - Handles successful payments
- `app/payment-cancelled.tsx` - Handles cancelled payments

### Payment Utilities
- `utils/payments.ts` - Helper functions for payment operations

## Testing Checklist

### iOS Testing
- [ ] Install app on iOS device/simulator
- [ ] Complete registration as Parent
- [ ] Tap "Pay with Apple In-App Purchase"
- [ ] Complete sandbox purchase
- [ ] Verify subscription activated
- [ ] Access Connect screen
- [ ] Test restore purchases

### Android Testing
- [ ] Install app on Android device/emulator
- [ ] Complete registration as Doula
- [ ] Tap "Pay with Google Play"
- [ ] Complete test purchase
- [ ] Verify subscription activated
- [ ] Access Connect screen
- [ ] Test restore purchases

### PayPal Testing
- [ ] Open app in web browser or mobile
- [ ] Complete registration
- [ ] Tap "Pay with PayPal"
- [ ] Complete sandbox payment
- [ ] Verify redirect to success page
- [ ] Verify subscription activated
- [ ] Access Connect screen

### Subscription Management
- [ ] Test auto-renewal
- [ ] Test subscription cancellation
- [ ] Test subscription expiration
- [ ] Test account deletion (should cancel subscription)

## Troubleshooting

### IAP Not Working
1. Check product IDs match exactly
2. Verify app bundle ID matches App Store Connect/Play Console
3. Ensure products are approved and available
4. Check sandbox test account is signed in
5. Verify `react-native-iap` is properly installed

### PayPal Not Working
1. Check environment variables are set
2. Verify PayPal credentials are correct
3. Check webhook URL is accessible
4. Verify webhook events are subscribed
5. Check backend logs for errors

### Subscription Not Activating
1. Check backend logs for verification errors
2. Verify webhook is receiving events
3. Check database for subscription record
4. Verify user profile is updated
5. Check frontend logs for API errors

## Security Notes

1. **Never store payment credentials in code**
2. **Always verify purchases on the backend**
3. **Use HTTPS for all payment communications**
4. **Validate webhook signatures**
5. **Store sensitive keys in environment variables**
6. **Use production credentials only in production**

## Support

For payment-related issues:
1. Check backend logs: Use `get_backend_logs` tool
2. Check frontend logs: Use `read_frontend_logs` tool
3. Verify environment variables are set correctly
4. Test in sandbox/development mode first
5. Contact payment provider support if needed

## Next Steps

1. Set up App Store Connect and Google Play Console accounts
2. Create in-app purchase products
3. Configure PayPal Business account
4. Set environment variables in backend
5. Test all payment flows in sandbox mode
6. Submit app for review
7. Enable production payment processing
