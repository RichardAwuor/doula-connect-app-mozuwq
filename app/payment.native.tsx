
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { ErrorModal } from '@/components/ConfirmModal';
import { apiPost } from '@/utils/api';
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
  console.log('[Payment Native] Screen mounted - iOS In-App Purchase version');
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [processing, setProcessing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [iapAvailable, setIapAvailable] = useState(false);
  const [products, setProducts] = useState<InAppPurchases.Product[]>([]);
  const [restoringPurchases, setRestoringPurchases] = useState(false);

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
      console.log('[Payment Native] Initializing iOS/Android in-app purchases...');
      const result = await InAppPurchases.initConnection();
      console.log('[Payment Native] IAP connection result:', result);
      setIapAvailable(true);

      if (userProfile) {
        const productId = userProfile.userType === 'parent' 
          ? PRODUCT_IDS.parent_annual 
          : PRODUCT_IDS.doula_monthly;
        
        console.log('[Payment Native] Fetching product:', productId);
        const availableProducts = await InAppPurchases.getProducts({ skus: [productId] });
        console.log('[Payment Native] Available products:', availableProducts);
        setProducts(availableProducts);
      }
    } catch (error) {
      console.error('[Payment Native] IAP initialization failed:', error);
      setIapAvailable(false);
      setErrorMessage('Unable to connect to App Store. Please check your internet connection and try again.');
      setErrorDetails(String(error));
      setShowErrorModal(true);
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

  const handleSubscribe = async () => {
    console.log('[Payment Native] User tapped Subscribe button');
    console.log('[Payment Native] Starting iOS/Android in-app purchase flow...');
    setProcessing(true);

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
              console.log('[Payment Native] POST /api/iap/verify-receipt', {
                userId: userProfile.id,
                platform: Platform.OS as 'ios' | 'android',
                productId,
              });
              
              const verifyResponse = await apiPost('/api/iap/verify-receipt', {
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
              
              console.log('[Payment Native] ✅ Purchase verified and subscription activated!');
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
    }
  };

  const handleRestorePurchases = async () => {
    console.log('[Payment Native] User tapped Restore Purchases');
    setRestoringPurchases(true);

    try {
      console.log('[Payment Native] POST /api/iap/restore-purchases', {
        userId: userProfile.id,
        platform: Platform.OS as 'ios' | 'android',
      });

      const response = await apiPost('/api/iap/restore-purchases', {
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

        console.log('[Payment Native] ✅ Purchases restored successfully!');
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
      errorMsg.includes('Network request failed') ||
      errorMsg.includes('Unable to connect')
    ) {
      userMessage = 'Cannot connect to the App Store. Please check your internet connection.';
      technicalDetails = errorMsg;
    } else if (
      errorMsg.includes('Purchase verification failed') ||
      errorMsg.includes('500')
    ) {
      userMessage = 'Server error occurred while verifying your purchase. Please contact support.';
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

  const processingText = processing ? 'Processing subscription...' : '';

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

        {!iapAvailable ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={styles.errorTitle}>Unable to Connect</Text>
            <Text style={styles.errorSubtitle}>
              Cannot connect to {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: 16 }]}
              onPress={initializeIAP}
            >
              <Text style={commonStyles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[commonStyles.button, processing && styles.buttonDisabled]}
              onPress={handleSubscribe}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="bag.fill"
                    android_material_icon_name="shopping-bag"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={[commonStyles.buttonText, { marginLeft: 8 }]}>Subscribe</Text>
                </>
              )}
            </TouchableOpacity>

            {processing && (
              <View style={styles.processingIndicator}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>{processingText}</Text>
              </View>
            )}

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
          </>
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
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
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
