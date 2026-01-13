
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import Constants from 'expo-constants';
import { apiPost } from '@/utils/api';

export default function PaymentScreen() {
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [processing, setProcessing] = useState(false);

  if (!userProfile) {
    return null;
  }

  const isParent = userProfile.userType === 'parent';
  const subscriptionFee = isParent ? 99 : 99;
  const subscriptionPeriod = isParent ? 'Annual' : 'Monthly';

  const handlePayment = async () => {
    console.log('[Payment Web] Opening Stripe Checkout...');
    setProcessing(true);

    try {
      // TODO: Backend Integration - Payment Checkout Endpoint
      // The backend needs to implement: POST /api/payments/create-checkout-session
      // Request body: { userId: string, userType: string, email: string }
      // Response: { success: boolean, checkoutUrl: string, sessionId: string }
      // This should create a Stripe Checkout session and return the URL
      
      const response = await apiPost('/api/payments/create-checkout-session', {
        userId: userProfile.id,
        userType: userProfile.userType,
        email: userProfile.email,
      });
      
      console.log('[Payment Web] Checkout session created:', response);

      if (response.success && response.checkoutUrl) {
        if (Platform.OS === 'web') {
          window.location.href = response.checkoutUrl;
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to create checkout session');
        setProcessing(false);
      }
    } catch (error: any) {
      console.error('[Payment Web] Error:', error);
      
      // Check if this is a "endpoint not found" error
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        Alert.alert(
          'Backend Not Ready',
          'The payment checkout endpoint is not yet implemented on the backend. Please implement POST /api/payments/create-checkout-session endpoint with Stripe integration.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to initialize payment. Please try again.');
      }
      
      setProcessing(false);
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
          <Text style={commonStyles.title}>Subscription Payment</Text>
          <Text style={styles.subtitle}>
            Complete your subscription to start connecting
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

          <Text style={styles.renewalNote}>
            Your subscription will automatically renew {isParent ? 'annually' : 'monthly'}.
            You can cancel anytime from your profile settings.
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Payment Method</Text>
          <View style={styles.paymentMethodContainer}>
            <IconSymbol
              ios_icon_name="creditcard"
              android_material_icon_name="credit-card"
              size={32}
              color={colors.primary}
            />
            <View style={styles.paymentMethodText}>
              <Text style={styles.paymentMethodTitle}>Secure Payment via Stripe</Text>
              <Text style={styles.paymentMethodSubtitle}>
                Your payment information is encrypted and secure
              </Text>
            </View>
          </View>
        </View>

        <View style={commonStyles.card}>
          <View style={styles.securityBadge}>
            <IconSymbol
              ios_icon_name="lock.shield"
              android_material_icon_name="lock"
              size={24}
              color={colors.success}
            />
            <Text style={styles.securityText}>
              Secure payment processing powered by Stripe
            </Text>
          </View>
        </View>

        <View style={styles.webNotice}>
          <IconSymbol
            ios_icon_name="info.circle"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.webNoticeText}>
            You will be redirected to Stripe Checkout to complete your payment
          </Text>
        </View>

        <TouchableOpacity
          style={[commonStyles.button, processing && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          <Text style={commonStyles.buttonText}>
            {processing ? 'Processing...' : `Pay $${subscriptionFee}.00`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={commonStyles.outlineButton}
          onPress={() => router.back()}
          disabled={processing}
        >
          <Text style={commonStyles.outlineButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By completing this payment, you agree to our Terms of Service and Privacy Policy.
          Your subscription will automatically renew unless cancelled.
        </Text>
      </ScrollView>
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
  renewalNote: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    marginLeft: 16,
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  webNoticeText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
