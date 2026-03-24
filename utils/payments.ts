
import { Platform } from 'react-native';
import { apiPost, apiGet } from './api';

// Product IDs for in-app purchases
export const PRODUCT_IDS = {
  parent_annual: Platform.select({
    ios: 'com.doulaconnect.parent.annual',
    android: 'com.doulaconnect.parent.annual',
  }) as string,
  doula_monthly: Platform.select({
    ios: 'com.doulaconnect.doula.monthly',
    android: 'com.doulaconnect.doula.monthly',
  }) as string,
};

export interface SubscriptionStatus {
  status: 'active' | 'cancelled' | 'expired' | 'none';
  planType?: 'annual' | 'monthly';
  currentPeriodEnd?: string;
  platform?: 'ios' | 'android' | 'paypal' | 'stripe';
  autoRenew?: boolean;
}

/**
 * Verify purchase with backend
 */
export async function verifyPurchase(
  userId: string,
  receipt: string,
  platform: 'ios' | 'android',
  productId: string
): Promise<{ success: boolean; subscriptionId?: string; expiresAt?: string; error?: string }> {
  try {
    console.log('[Payments] Verifying purchase with backend...');
    console.log('[Payments] POST /api/payments/verify-iap', { userId, platform, productId });

    const response = await apiPost('/api/payments/verify-iap', {
      userId,
      receipt,
      platform,
      productId,
    });

    console.log('[Payments] Purchase verification response:', response);
    return response;
  } catch (error: any) {
    console.error('[Payments] Purchase verification failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify purchase',
    };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(
  userId: string,
  platform: 'ios' | 'android'
): Promise<{ success: boolean; hasActiveSubscription: boolean; subscription?: any }> {
  try {
    console.log('[Payments] Restoring purchases...');
    console.log('[Payments] POST /api/payments/restore-purchases', { userId, platform });

    const response = await apiPost('/api/payments/restore-purchases', {
      userId,
      platform,
    });

    console.log('[Payments] Restore purchases response:', response);
    return response;
  } catch (error: any) {
    console.error('[Payments] Failed to restore purchases:', error);
    return {
      success: false,
      hasActiveSubscription: false,
    };
  }
}

/**
 * Get subscription status from backend
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    console.log('[Payments] Fetching subscription status for user:', userId);
    console.log('[Payments] GET /api/payments/subscription-status/' + userId);

    const response = await apiGet(`/api/payments/subscription-status/${userId}`);

    console.log('[Payments] Subscription status response:', response);

    if (response.subscription) {
      return {
        status: response.subscription.status,
        planType: response.subscription.planType,
        currentPeriodEnd: response.subscription.currentPeriodEnd,
        platform: response.subscription.platform,
        autoRenew: response.subscription.autoRenew,
      };
    }

    return { status: 'none' };
  } catch (error: any) {
    console.error('[Payments] Failed to get subscription status:', error);
    // 404 means no subscription found - that's a valid state
    return { status: 'none' };
  }
}
