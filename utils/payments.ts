
import * as InAppPurchases from 'react-native-iap';
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
 * Initialize in-app purchases connection
 */
export async function initializeIAP(): Promise<boolean> {
  try {
    console.log('[Payments] Initializing IAP connection...');
    await InAppPurchases.initConnection();
    console.log('[Payments] IAP connection initialized successfully');
    return true;
  } catch (error) {
    console.error('[Payments] Failed to initialize IAP:', error);
    return false;
  }
}

/**
 * Get available products for the user
 */
export async function getAvailableProducts(userType: 'parent' | 'doula'): Promise<InAppPurchases.Product[]> {
  try {
    const productId = userType === 'parent' ? PRODUCT_IDS.parent_annual : PRODUCT_IDS.doula_monthly;
    console.log('[Payments] Fetching products for:', productId);
    
    const products = await InAppPurchases.getProducts({ skus: [productId] });
    console.log('[Payments] Available products:', products);
    
    return products;
  } catch (error) {
    console.error('[Payments] Failed to get products:', error);
    return [];
  }
}

/**
 * Purchase a subscription
 */
export async function purchaseSubscription(
  productId: string,
  onSuccess: (purchase: InAppPurchases.Purchase) => void,
  onError: (error: any) => void
): Promise<void> {
  try {
    console.log('[Payments] Requesting purchase for:', productId);
    
    // Set up purchase listeners
    const purchaseUpdateSubscription = InAppPurchases.purchaseUpdatedListener(
      async (purchase: InAppPurchases.Purchase) => {
        console.log('[Payments] Purchase updated:', purchase);
        onSuccess(purchase);
      }
    );

    const purchaseErrorSubscription = InAppPurchases.purchaseErrorListener(
      (error: InAppPurchases.PurchaseError) => {
        console.error('[Payments] Purchase error:', error);
        onError(error);
      }
    );

    // Request the purchase
    await InAppPurchases.requestPurchase({ sku: productId });

    // Cleanup listeners after 60 seconds
    setTimeout(() => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    }, 60000);

  } catch (error) {
    console.error('[Payments] Failed to request purchase:', error);
    onError(error);
  }
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
 * Finish a transaction
 */
export async function finishTransaction(purchase: InAppPurchases.Purchase): Promise<void> {
  try {
    console.log('[Payments] Finishing transaction:', purchase.transactionId);
    await InAppPurchases.finishTransaction({ purchase });
    console.log('[Payments] Transaction finished successfully');
  } catch (error) {
    console.error('[Payments] Failed to finish transaction:', error);
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

/**
 * Create PayPal payment session
 */
export async function createPayPalSession(
  userId: string,
  userType: 'parent' | 'doula',
  planType: 'annual' | 'monthly',
  email: string
): Promise<{ success: boolean; orderId?: string; approvalUrl?: string; error?: string }> {
  try {
    console.log('[Payments] Creating PayPal session...');
    
    const response = await apiPost('/payments/create-session', {
      userId,
      userType,
      planType,
      email,
    });

    console.log('[Payments] PayPal session created:', response);
    return response;
  } catch (error: any) {
    console.error('[Payments] Failed to create PayPal session:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment session',
    };
  }
}

/**
 * End IAP connection (cleanup)
 */
export async function endIAPConnection(): Promise<void> {
  try {
    console.log('[Payments] Ending IAP connection...');
    await InAppPurchases.endConnection();
    console.log('[Payments] IAP connection ended');
  } catch (error) {
    console.error('[Payments] Failed to end IAP connection:', error);
  }
}
