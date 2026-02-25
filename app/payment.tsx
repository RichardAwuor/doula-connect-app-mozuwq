
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

export default function PaymentScreen() {
  console.log('[Payment] Screen mounted - Web version');
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'stripe' | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    console.log('[Payment] User profile:', userProfile ? {
      id: userProfile.id,
      email: userProfile.email,
      userType: userProfile.userType
    } : 'null');
  }, [userProfile]);

  if (!userProfile) {
    console.log('[Payment] No user profile found');
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
  const subscriptionFee = 99;
  const subscriptionPeriod = isParent ? 'Annual' : 'Monthly';
  const planType = isParent ? 'annual' : 'monthly';

  const handlePayPalPayment = async () => {
    console.log('[Payment] Starting PayPal payment process...');
    setProcessing(true);
    setSelectedMethod('paypal');

    try {
      // Pre-flight check: verify PayPal service is available
      console.log('[Payment] Checking PayPal service availability...');
      try {
        const statusResponse = await apiGet('/status/paypal');
        console.log('[Payment] PayPal status:', statusResponse);
        if (!statusResponse.available) {
          throw new Error(
            statusResponse.error ||
            'Payment processing is currently unavailable. PayPal credentials not configured.'
          );
        }
      } catch (statusError: any) {
        // If status check itself fails with a PayPal-related error, surface it
        if (
          statusError.message?.includes('Payment processing') ||
          statusError.message?.includes('PayPal') ||
          statusError.message?.includes('unavailable')
        ) {
          throw statusError;
        }
        // Otherwise, proceed anyway (status endpoint might not be accessible)
        console.warn('[Payment] Could not check PayPal status, proceeding anyway:', statusError.message);
      }

      const response = await apiPost('/payments/create-session', {
        userId: userProfile.id,
        userType: userProfile.userType,
        planType: planType,
        email: userProfile.email,
      });

      console.log('[Payment] PayPal order created:', response);

      if (response.success && response.approvalUrl) {
        console.log('[Payment] Redirecting to PayPal approval URL');
        // Open PayPal approval URL in browser
        await Linking.openURL(response.approvalUrl);
        
        // Reset processing state after opening URL
        setProcessing(false);
        setSelectedMethod(null);
        
        // Note: User will be redirected back to the app after payment
        // The webhook will handle subscription activation
      } else {
        throw new Error('Failed to create PayPal order - no approval URL returned');
      }
    } catch (error: any) {
      console.error('[Payment] PayPal payment error:', error);
      handlePaymentError(error);
      setProcessing(false);
      setSelectedMethod(null);
    }
  };

  const handleStripePayment = async () => {
    console.log('[Payment] Stripe payment not yet implemented for web');
    setErrorMessage('Stripe payment is coming soon. Please use PayPal for now.');
    setErrorDetails('Stripe integration is in progress.');
    setShowErrorModal(true);
  };

  const handlePaymentError = (error: any) => {
    console.error('[Payment] Payment error details:', error);
    
    let userMessage = 'An unexpected error occurred during payment.';
    let technicalDetails = '';

    const errorMsg = error?.message || '';

    // Check for PayPal service unavailable (503) - message comes from apiPost as thrown Error
    if (
      errorMsg.includes('Payment processing is currently unavailable') ||
      errorMsg.includes('PayPal credentials not configured') ||
      errorMsg.includes('Service Unavailable') ||
      errorMsg.includes('503')
    ) {
      userMessage = 'Payment processing is currently unavailable. The PayPal service is not configured on the server. Please contact support or try again later.';
      technicalDetails = 'Backend error: PayPal credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are not set in the server environment.';
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

  const paymentMethodLabel = selectedMethod === 'paypal' ? 'PayPal' : selectedMethod === 'stripe' ? 'Stripe' : '';
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
            <Text style={styles.totalValue}>${subscriptionFee}.00 USD</Text>
          </View>
        </View>

        <View style={styles.paymentMethodsContainer}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Select Payment Method</Text>

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

          <TouchableOpacity
            style={[styles.paymentMethodButton, styles.comingSoon, processing && styles.buttonDisabled]}
            onPress={handleStripePayment}
            disabled={processing}
          >
            <View style={styles.paymentMethodContent}>
              <IconSymbol
                ios_icon_name="creditcard"
                android_material_icon_name="credit-card"
                size={24}
                color={colors.textSecondary}
              />
              <View style={styles.paymentMethodText}>
                <Text style={[styles.paymentMethodTitle, { color: colors.textSecondary }]}>
                  Credit/Debit Card
                </Text>
                <Text style={styles.paymentMethodSubtitle}>Coming soon</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {processing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>{processingText}</Text>
          </View>
        )}

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
  comingSoon: {
    opacity: 0.6,
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
