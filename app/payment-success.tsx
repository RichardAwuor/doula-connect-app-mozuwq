
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentSuccessScreen() {
  console.log('[Payment Success] Screen mounted');
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { userProfile, setUserProfile } = useUser();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    console.log('[Payment Success] Order ID:', orderId);
    handlePaymentSuccess();
  }, [orderId]);

  const handlePaymentSuccess = async () => {
    try {
      console.log('[Payment Success] Processing payment success...');
      
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (userProfile) {
        // Update local profile
        const updatedProfile = {
          ...userProfile,
          subscriptionActive: true,
        };
        
        setUserProfile(updatedProfile);
        await AsyncStorage.setItem('doula_connect_subscription_active', 'true');
        console.log('[Payment Success] Subscription marked as active');
      }

      setProcessing(false);

      // Navigate to Connect screen after 2 seconds
      setTimeout(() => {
        console.log('[Payment Success] Navigating to Connect screen');
        router.replace('/(tabs)/connect');
      }, 2000);

    } catch (error) {
      console.error('[Payment Success] Error processing payment success:', error);
      setProcessing(false);
      
      // Still navigate to Connect screen
      setTimeout(() => {
        router.replace('/(tabs)/connect');
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={[commonStyles.container, styles.content]}>
        <IconSymbol
          ios_icon_name="checkmark.circle.fill"
          android_material_icon_name="check-circle"
          size={80}
          color={colors.success}
        />
        
        <Text style={[commonStyles.title, styles.title]}>
          Payment Successful!
        </Text>
        
        <Text style={styles.message}>
          Your subscription is now active. You have full access to all app features.
        </Text>

        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>
              Activating your subscription...
            </Text>
          </View>
        )}

        {!processing && (
          <Text style={styles.redirectText}>
            Redirecting to Connect screen...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginTop: 24,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  processingContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 12,
  },
  redirectText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 32,
    fontWeight: '600',
  },
});
