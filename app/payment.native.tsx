
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
import * as WebBrowser from 'expo-web-browser';

export default function PaymentScreen() {
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [processing, setProcessing] = useState(false);

  if (!userProfile) {
    return null;
  }

  const isParent = userProfile.userType === 'parent';
  const subscriptionFee = 99;
  const subscriptionPeriod = isParent ? 'Annual' : 'Monthly';

  const handlePayment = async () => {
    console.log('[Payment Native] Creating PayPal payment session...');
    console.log('[Payment Native] User profile:', {
      id: userProfile.id,
      email: userProfile.email,
      userType: userProfile.userType
    });
    
    setProcessing(true);

    try {
      const requestData = {
        userId: userProfile.id,
        userType: userProfile.userType,
        planType: isParent ? 'annual' : 'monthly',
        email: userProfile.email,
      };
      
      console.log('[Payment Native] Sending payment request:', requestData);
      
      const response = await apiPost('/payments/create-session', requestData);
      
      console.log('[Payment Native] PayPal payment session created:', response);

      if (response.success && response.approvalUrl) {
        console.log('[Payment Native] Opening PayPal Checkout:', response.approvalUrl);
        
        // Open PayPal Checkout in browser
        const result = await WebBrowser.openBrowserAsync(response.approvalUrl);
        console.log('[Payment Native] Browser result:', result);
        
        // After user closes the browser, check subscription status
        if (result.type === 'cancel' || result.type === 'dismiss') {
          console.log('[Payment Native] User closed checkout, checking subscription status...');
          
          // Wait a bit for webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const { apiGet } = await import('@/utils/api');
            const subscription = await apiGet(`/subscriptions/${userProfile.id}`);
            console.log('[Payment Native] Subscription status:', subscription);
            
            if (subscription.status === 'active') {
              // Update local profile
              setUserProfile({
                ...userProfile,
                subscriptionActive: true,
              });
              
              Alert.alert(
                'Payment Successful',
                'Your subscription is now active!',
                [
                  {
                    text: 'Continue',
                    onPress: () => {
                      router.replace('/(tabs)/connect');
                    }
                  }
                ]
              );
            } else {
              Alert.alert(
                'Payment Status',
                'Please complete the payment to activate your subscription.',
                [
                  {
                    text: 'Try Again',
                    onPress: () => setProcessing(false)
                  }
                ]
              );
            }
          } catch (error: any) {
            console.error('[Payment Native] Error checking subscription:', error);
            Alert.alert(
              'Payment Status Unknown',
              'Please check your subscription status in your profile.',
              [
                {
                  text: 'OK',
                  onPress: () => setProcessing(false)
                }
              ]
            );
          }
        }
        
        setProcessing(false);
      } else {
        throw new Error(response.error || 'Failed to create payment session');
      }
    } catch (error: any) {
      console.error('[Payment Native] Payment error:', error);
      console.error('[Payment Native] Error message:', error.message);
      
      let errorTitle = 'Payment Error';
      let errorMessage = 'An error occurred while processing your payment. Please try again.';
      
      // Check for specific error messages
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        // PayPal not configured
        if (msg.includes('paypal') && (msg.includes('not available') || msg.includes('disabled') || msg.includes('environment variables'))) {
          errorTitle = 'Payment System Unavailable';
          errorMessage = 'The payment system is currently being configured. Please contact support or try again later.\n\nError: PayPal credentials not configured on the server.';
        }
        // Service unavailable
        else if (msg.includes('503') || msg.includes('service unavailable')) {
          errorTitle = 'Service Unavailable';
          errorMessage = 'The payment service is temporarily unavailable. Please try again in a few minutes.';
        }
        // Network errors
        else if (msg.includes('network') || msg.includes('fetch')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to the payment server. Please check your internet connection and try again.';
        }
        // Backend not configured
        else if (msg.includes('backend url not configured')) {
          errorTitle = 'Configuration Error';
          errorMessage = 'The app is not properly configured. Please contact support.';
        }
        // Generic server error
        else if (msg.includes('server error')) {
          errorTitle = 'Server Error';
          errorMessage = 'A server error occurred. Please try again later or contact support.';
        }
        // Use the actual error message if none of the above match
        else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => setProcessing(false)
          }
        ]
      );
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
              <Text style={styles.paymentMethodTitle}>Secure Payment via PayPal</Text>
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
              Secure payment processing powered by PayPal
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
            You will be redirected to PayPal to complete your payment
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
