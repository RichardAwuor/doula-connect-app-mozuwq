
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { ErrorModal } from '@/components/ConfirmModal';
import { apiPost, apiGet } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as InAppPurchases from 'react-native-iap';

const PRODUCT_IDS = {
  parent_annual: Platform.select({
    ios: 'com.doulaconnect.parent.annual',
    android: 'com.doulaconnect.parent.annual',
  }) as string,
  doula_monthly: Platform.select({
    ios: 'com.doulaconnect.doula.monthly',
    android: 'com.doulaconnect.doula.monthly',
  }) as string,
};

export default function PaymentScreen() {
  console.log('[Payment Native] Screen mounted - Native version');
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'iap' | 'paypal' | 'stripe' | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [iapAvailable, setIapAvailable] = useState(false);
  const [products, setProducts] = useState<InAppPurchases.Product[]>([]);
  const [restoringPurchases, setRestoringPurchases] = useState(false);
  const [showDiagnosticsButton, setShowDiagnosticsButton] = useState(false);

  useEffect(() => {
    console.log('[Payment Native] User profile:', userProfile ? {
      id: userProfile.id,
      email: userProfile.email,
      userType: userProfile.userType
    } : 'null');

    initializeIAP();

    return () => {
      InAppPurchases.endConnection();
    };
  }, [userProfile]);

  const initializeIAP = async () => {
    try {
      console.log('[Payment Native] Initializing in-app purchases...');
      const result = await InAppPurchases.initConnection();
      console.log('[Payment Native] IAP connection result:', result);
      setIapAvailable(true);

      if (userProfile) {
        const productId = userProfile.userType === 'parent' 
          ? PRODUCT_IDS.parent_annual 
          : PRODUCT_IDS.doula_monthly;
        
        const availableProducts = await InAppPurchases.getProducts({ skus: [productId] });
        console.log('[Payment Native] Available products:', availableProducts);
        setProducts(availableProducts);
      }
    } catch (error) {
      console.warn('[Payment Native] IAP initialization failed:', error);
      setIapAvailable(false);
    }
  };

  if (!userProfile) {
    console.log('[Payment Native] No user profile found');
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="warning"
            size={64}
            color={colors.error}
          />
          <Text style={[commonStyles.title, { textAlign: 'center', marginTop: 16 }]}>
            Profile Not Found
          </Text>
          <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 8 }]}>
            Please complete registration first
          </Text>
          <TouchableOpacity
            style={[commonStyles.button, { marginTop: 24 }]}
            onPress={() => router.replace('/welcome')}
          >
            <Text style={commonStyles.buttonText}>Back to Welcome</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isParent = userProfile.userType === 'parent';
  const subscriptionFee = '99.99';
  const subscriptionPeriod = isParent ? 'Annual' : 'Monthly';
  const planType = isParent ? 'annual' : 'monthly';
  const productId = isParent ? PRODUCT_IDS.parent_annual : PRODUCT_IDS.doula_monthly;

  const handleInAppPurchase = async () => {
    console.log('[Payment Native] Starting in-app purchase...');
    setProcessing(true);
    setSelectedMethod('iap');

    try {
      console.log('[Payment Native] Requesting purchase for product:', productId);
      await InAppPurchases.requestPurchase({ sku: productId });

      const purchaseUpdateSubscription = InAppPurchases.purchaseUpdatedListener(
        async (purchase: InAppPurchases.Purchase) => {
          console.log('[Payment Native] Purchase updated:', purchase);
          
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            try {
              console.log('[Payment Native] Verifying purchase with backend...');
              console.log('[Payment Native] POST /api/payments/verify-iap', {
                userId: userProfile.id,
                platform: Platform.OS as 'ios' | 'android',
                productId,
              });
              
              const verifyResponse = await apiPost('/api/payments/verify-iap', {
                userId: userProfile.id,
                receipt,
                platform: Platform.OS as 'ios' | 'android',
                productId,
              });
              
              console.log('[Payment Native] Verification response:', verifyResponse);
              
              if (!verifyResponse.success) {
                throw new Error(verifyResponse.error || 'Purchase verification failed');
              }
              
              const updatedProfile = {
                ...userProfile,
                subscriptionActive: true,
              };
              
              setUserProfile(updatedProfile);
              await AsyncStorage.setItem('doula_connect_subscription_active', 'true');
              
              await InAppPurchases.finishTransaction({ purchase });
              
              console.log('[Payment Native] Purchase verified and activated successfully!');
              router.replace('/(tabs)/connect');
            } catch (error) {
              console.error('[Payment Native] Purchase verification error:', error);
              handlePaymentError(error);
            }
          }
        }
      );

      const purchaseErrorSubscription = InAppPurchases.purchaseErrorListener(
        (error: InAppPurchases.PurchaseError) => {
          console.error('[Payment Native] Purchase error:', error);
          handlePaymentError(error);
        }
      );

      setTimeout(() => {
        purchaseUpdateSubscription.remove();
        purchaseErrorSubscription.remove();
      }, 30000);

    } catch (error: any) {
      console.error('[Payment Native] In-app purchase error:', error);
      handlePaymentError(error);
    } finally {
      setProcessing(false);
      setSelectedMethod(null);
    }
  };

  const handlePayPalPayment = async () => {
    console.log('[Payment Native] Starting PayPal payment process...');
    setProcessing(true);
    setSelectedMethod('paypal');

    try {
      console.log('[Payment Native] Checking PayPal service availability...');
      try {
        const statusResponse = await apiGet('/status/paypal');
        console.log('[Payment Native] PayPal status:', statusResponse);
        if (!statusResponse.available) {
          setShowDiagnosticsButton(true);
          throw new Error(
            statusResponse.error ||
            'Payment processing is currently unavailable. PayPal credentials not configured.'
          );
        }
      } catch (statusError: any) {
        if (
          statusError.message?.includes('Payment processing') ||
          statusError.message?.includes('PayPal') ||
          statusError.message?.includes('unavailable')
        ) {
          setShowDiagnosticsButton(true);
          throw statusError;
        }
        console.warn('[Payment Native] Could not check PayPal status, proceeding anyway:', statusError.message);
      }

      const response = await apiPost('/payments/create-session', {
        userId: userProfile.id,
        userType: userProfile.userType,
        planType: planType,
        email: userProfile.email,
      });

      console.log('[Payment Native] PayPal order created:', response);

      if (response.success && response.approvalUrl) {
        console.log('[Payment Native] Opening PayPal approval URL');
        await Linking.openURL(response.approvalUrl);
        
        setProcessing(false);
        setSelectedMethod(null);
      } else {
        throw new Error('Failed to create PayPal order - no approval URL returned');
      }
    } catch (error: any) {
      console.error('[Payment Native] PayPal payment error:', error);
      handlePaymentError(error);
      setProcessing(false);
      setSelectedMethod(null);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('[Payment Native] Restoring purchases...');
    setRestoringPurchases(true);

    try {
      console.log('[Payment Native] POST /api/payments/restore-purchases', {
        userId: userProfile.id,
        platform: Platform.OS as 'ios' | 'android',
      });

      const response = await apiPost('/api/payments/restore-purchases', {
        userId: userProfile.id,
        platform: Platform.OS as 'ios' | 'android',
      });

      console.log('[Payment Native] Restore purchases response:', response);

      if (response.success && response.hasActiveSubscription) {
        const updatedProfile = {
          ...userProfile,
          subscriptionActive: true,
        };
        setUserProfile(updatedProfile);
        await AsyncStorage.setItem('doula_connect_subscription_active', 'true');

        console.log('[Payment Native] Purchases restored successfully!');
        router.replace('/(tabs)/connect');
      } else {
        setErrorMessage('No active subscription found to restore. Please purchase a subscription to continue.');
        setErrorDetails('');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('[Payment Native] Restore purchases error:', error);
      setErrorMessage(error.message || 'Failed to restore purchases. Please try again.');
      setErrorDetails(JSON.stringify(error));
      setShowErrorModal(true);
    } finally {
      setRestoringPurchases(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('[Payment Native] Payment error details:', error);
    
    if (error.code === 'E_USER_CANCELLED') {
      console.log('[Payment Native] User cancelled payment');
      return;
    }

    let userMessage = 'An unexpected error occurred during payment.';
    let technicalDetails = '';

    const errorMsg = error?.message || '';

    if (
      errorMsg.includes('Payment processing is currently unavailable') ||
      errorMsg.includes('PayPal credentials not configured') ||
      errorMsg.includes('Service Unavailable') ||
      errorMsg.includes('503')
    ) {
      userMessage = 'Payment processing is currently unavailable. The PayPal service is not configured on the server.';
      technicalDetails = 'Backend error: PayPal credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are not set in the server environment.';
      setShowDiagnosticsButton(true);
    } else if (
      errorMsg.includes('Missing required fields') ||
      errorMsg.includes('must choose')
    ) {
      userMessage = errorMsg;
      technicalDetails = 'Request validation failed.';
    } else if (
      errorMsg.includes('Failed to create payment order') ||
      errorMsg.includes('500')
    ) {
      userMessage = 'Server error occurred while processing payment. Please try again later.';
      technicalDetails = errorMsg;
    } else if (
      errorMsg.includes('Network request failed') ||
      errorMsg.includes('Unable to connect')
    ) {
      userMessage = 'Cannot connect to the payment server. Please check your internet connection.';
      technicalDetails = errorMsg;
    } else if (errorMsg) {
      userMessage = errorMsg;
      technicalDetails = error.stack || error.toString();
    } else {
      technicalDetails = JSON.stringify(error, null, 2);
    }

    setErrorMessage(userMessage);
    setErrorDetails(technicalDetails);
    setShowErrorModal(true);
  };

  const paymentMethodLabel = selectedMethod === 'iap' ? 'In-App Purchase' : selectedMethod === 'paypal' ? 'PayPal' : '';
  const processingText = processing ? `Processing ${paymentMethodLabel}...` : '';

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="creditcard"
            android_material_icon_name="payment"
            size={64}
            color={colors.primary}
          />
          <Text style={commonStyles.title}>Complete Payment</Text>
          <Text style={styles.subtitle}>
            Choose your payment method to activate your subscription
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Subscription Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>User Type:</Text>
            <Text style={styles.detailValue}>
              {isParent ? 'New Parent' : 'Doula'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subscription Period:</Text>
            <Text style={styles.detailValue}>{subscriptionPeriod}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto-Renewal:</Text>
            <Text style={styles.detailValue}>Yes</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>${subscriptionFee} USD</Text>
          </View>
        </View>

        <View style={styles.paymentMethodsContainer}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Select Payment Method</Text>

          {iapAvailable && (
            <TouchableOpacity
              style={[styles.paymentMethodButton, processing && styles.buttonDisabled]}
              onPress={handleInAppPurchase}
              disabled={processing}
            >
              <View style={styles.paymentMethodContent}>
                <IconSymbol
                  ios_icon_name="bag.fill"
                  android_material_icon_name="shopping-bag"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.paymentMethodText}>
                  <Text style={styles.paymentMethodTitle}>
                    {Platform.OS === 'ios' ? 'Apple In-App Purchase' : 'Google Play'}
                  </Text>
                  <Text style={styles.paymentMethodSubtitle}>
                    Pay securely through {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
                  </Text>
                </View>
              </View>
              {processing && selectedMethod === 'iap' && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.paymentMethodButton, processing && styles.buttonDisabled]}
            onPress={handlePayPalPayment}
            disabled={processing}
          >
            <View style={styles.paymentMethodContent}>
              <IconSymbol
                ios_icon_name="creditcard.fill"
                android_material_icon_name="payment"
                size={24}
                color={colors.primary}
              />
              <View style={styles.paymentMethodText}>
                <Text style={styles.paymentMethodTitle}>PayPal</Text>
                <Text style={styles.paymentMethodSubtitle}>Pay securely with PayPal</Text>
              </View>
            </View>
            {processing && selectedMethod === 'paypal' && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {processing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>{processingText}</Text>
          </View>
        )}

        {iapAvailable && (
          <TouchableOpacity
            style={[commonStyles.outlineButton, { marginTop: 12 }]}
            onPress={handleRestorePurchases}
            disabled={processing || restoringPurchases}
          >
            {restoringPurchases ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={commonStyles.outlineButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
        )}

        {showDiagnosticsButton && (
          <TouchableOpacity
            style={[commonStyles.outlineButton, { marginTop: 12, borderColor: colors.primary }]}
            onPress={() => router.push('/payment-diagnostics')}
            disabled={processing || restoringPurchases}
          >
            <Text style={[commonStyles.outlineButtonText, { color: colors.primary }]}>
              View Payment Diagnostics
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[commonStyles.outlineButton, { marginTop: 12 }]}
          onPress={() => router.back()}
          disabled={processing || restoringPurchases}
        >
          <Text style={commonStyles.outlineButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="lock.fill"
            android_material_icon_name="lock"
            size={20}
            color={colors.success}
          />
          <Text style={styles.infoText}>
            Your payment information is secure and encrypted. We never store your credit card details.
          </Text>
        </View>
      </ScrollView>

      <ErrorModal
        visible={showErrorModal}
        title="Payment Failed"
        message={errorMessage}
        details={errorDetails}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentMethodsContainer: {
    marginTop: 24,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    marginLeft: 16,
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  processingIndicator: {
    alignItems: 'center',
    marginVertical: 24,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
