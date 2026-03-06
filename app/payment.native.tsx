
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { ErrorModal } from '@/components/ConfirmModal';
import { apiPost } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  console.log('[Payment Native] Screen mounted - Simulated iOS In-App Purchase');
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [processing, setProcessing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showApplePaymentSheet, setShowApplePaymentSheet] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'authenticating' | 'processing' | 'verifying'>('idle');

  useEffect(() => {
    console.log('[Payment Native] User profile:', userProfile ? {
      id: userProfile.id,
      email: userProfile.email,
      userType: userProfile.userType
    } : 'null');
  }, [userProfile]);

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
    console.log('[Payment Native] Starting simulated iOS/Android in-app purchase flow...');
    
    // Show Apple/Google payment sheet
    setShowApplePaymentSheet(true);
  };

  const handleApplePaymentConfirm = async () => {
    setProcessing(true);
    setPaymentStep('authenticating');

    try {
      // Simulate Face ID / Touch ID authentication
      console.log('[Payment Native] Simulating biometric authentication...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPaymentStep('processing');
      console.log('[Payment Native] Simulating payment processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate simulated receipt
      const simulatedReceipt = `SIMULATED_RECEIPT_${Date.now()}_${userProfile.id}`;
      const simulatedTransactionId = `TXN_${Date.now()}`;
      
      setPaymentStep('verifying');
      console.log('[Payment Native] Verifying purchase with backend...');
      console.log('[Payment Native] POST /api/payments/verify-iap', {
        userId: userProfile.id,
        platform: Platform.OS as 'ios' | 'android',
        productId,
      });
      
      const verifyResponse = await apiPost('/api/payments/verify-iap', {
        userId: userProfile.id,
        receipt: simulatedReceipt,
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
      
      console.log('[Payment Native] ✅ Purchase verified and subscription activated!');
      
      // Close payment sheet
      setShowApplePaymentSheet(false);
      
      // Navigate to success screen
      router.replace('/payment-success');
    } catch (error: any) {
      console.error('[Payment Native] Payment error:', error);
      setShowApplePaymentSheet(false);
      handlePaymentError(error);
    } finally {
      setProcessing(false);
      setPaymentStep('idle');
    }
  };

  const handleApplePaymentCancel = () => {
    console.log('[Payment Native] User cancelled payment');
    setShowApplePaymentSheet(false);
    setProcessing(false);
    setPaymentStep('idle');
  };

  const handleRestorePurchases = async () => {
    console.log('[Payment Native] User tapped Restore Purchases');
    setProcessing(true);

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

        console.log('[Payment Native] ✅ Purchases restored successfully!');
        router.replace('/(tabs)/connect');
      } else {
        setErrorMessage('No active subscription found. Please subscribe to continue.');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('[Payment Native] Restore purchases error:', error);
      handlePaymentError(error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('[Payment Native] Payment error details:', error);
    
    let userMessage = 'Payment could not be completed. Please try again.';

    const errorMsg = error?.message || '';

    // Simplify error messages to be user-friendly
    if (errorMsg.toLowerCase().includes('user not found')) {
      userMessage = 'Account not found. Please complete registration first.';
    } else if (
      errorMsg.includes('Network request failed') ||
      errorMsg.includes('Unable to connect')
    ) {
      userMessage = 'Connection error. Please check your internet and try again.';
    } else if (
      errorMsg.includes('Purchase verification failed') ||
      errorMsg.includes('500')
    ) {
      userMessage = 'Server error. Please try again or contact support.';
    } else if (errorMsg.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    } else if (errorMsg) {
      // Use the error message if it's already user-friendly
      userMessage = errorMsg;
    }

    setErrorMessage(userMessage);
    setShowErrorModal(true);
  };

  const getPaymentStepText = () => {
    switch (paymentStep) {
      case 'authenticating':
        return 'Authenticating with Face ID...';
      case 'processing':
        return 'Processing payment...';
      case 'verifying':
        return 'Verifying purchase...';
      default:
        return '';
    }
  };

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
            Subscribe via your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account
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
                ios_icon_name="applelogo"
                android_material_icon_name="shopping-bag"
                size={20}
                color="#FFFFFF"
              />
              <Text style={[commonStyles.buttonText, { marginLeft: 8 }]}>Subscribe</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.outlineButton, { marginTop: 12 }]}
          onPress={handleRestorePurchases}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={commonStyles.outlineButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.outlineButton, { marginTop: 12 }]}
          onPress={() => router.back()}
          disabled={processing}
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
            Your payment is processed securely through {Platform.OS === 'ios' ? 'Apple' : 'Google Play'}. We never see or store your payment information.
          </Text>
        </View>

        <View style={[styles.infoBox, { borderLeftColor: colors.primary, marginTop: 16 }]}>
          <IconSymbol
            ios_icon_name="info.circle"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            This is a simulated payment flow for demonstration purposes. In production, this will connect to your actual {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account.
          </Text>
        </View>
      </ScrollView>

      {/* Simulated Apple/Google Payment Sheet */}
      <Modal
        visible={showApplePaymentSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleApplePaymentCancel}
      >
        <SafeAreaView style={styles.paymentSheetContainer}>
          <View style={styles.paymentSheetHeader}>
            <TouchableOpacity onPress={handleApplePaymentCancel} disabled={processing}>
              <Text style={[styles.cancelButton, processing && { opacity: 0.5 }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.paymentSheetTitle}>
              {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.paymentSheetContent}>
            <View style={styles.appIconContainer}>
              <View style={styles.appIcon}>
                <IconSymbol
                  ios_icon_name="heart.fill"
                  android_material_icon_name="favorite"
                  size={48}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.appName}>Doula Connect</Text>
            </View>

            <View style={styles.subscriptionCard}>
              <Text style={styles.subscriptionTitle}>
                {isParent ? 'Parent Annual Subscription' : 'Doula Monthly Subscription'}
              </Text>
              <Text style={styles.subscriptionPrice}>${subscriptionFee}</Text>
              <Text style={styles.subscriptionPeriod}>
                Billed {isParent ? 'annually' : 'monthly'}
              </Text>
              
              <View style={styles.subscriptionDetails}>
                <View style={styles.subscriptionDetailRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={styles.subscriptionDetailText}>
                    Full access to all features
                  </Text>
                </View>
                <View style={styles.subscriptionDetailRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={styles.subscriptionDetailText}>
                    Connect with {isParent ? 'certified doulas' : 'new parents'}
                  </Text>
                </View>
                <View style={styles.subscriptionDetailRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={styles.subscriptionDetailText}>
                    Cancel anytime
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>Payment Method</Text>
              <View style={styles.paymentMethodRow}>
                <IconSymbol
                  ios_icon_name="applelogo"
                  android_material_icon_name="shopping-bag"
                  size={24}
                  color={colors.text}
                />
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodText}>
                    {Platform.OS === 'ios' ? 'Pay with Apple' : 'Pay with Google'}
                  </Text>
                  <Text style={styles.paymentMethodSubtext}>
                    {userProfile.email}
                  </Text>
                </View>
              </View>
            </View>

            {processing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>{getPaymentStepText()}</Text>
              </View>
            )}

            {!processing && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleApplePaymentConfirm}
              >
                <IconSymbol
                  ios_icon_name="faceid"
                  android_material_icon_name="fingerprint"
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.confirmButtonText}>
                  Confirm with {Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint'}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.termsText}>
              Your subscription will automatically renew unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} settings.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ErrorModal
        visible={showErrorModal}
        title="Payment Failed"
        message={errorMessage}
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
  // Payment Sheet Styles
  paymentSheetContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  paymentSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    fontSize: 17,
    color: colors.primary,
    fontWeight: '600',
  },
  paymentSheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  paymentSheetContent: {
    padding: 24,
  },
  appIconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  subscriptionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subscriptionPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  subscriptionPeriod: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  subscriptionDetails: {
    width: '100%',
  },
  subscriptionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionDetailText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  paymentMethodCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    marginLeft: 16,
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  paymentMethodSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
