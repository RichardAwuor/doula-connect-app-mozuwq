
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

export default function PaymentScreen() {
  console.log('[Payment] Screen mounted - SIMULATED MODE');
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [processing, setProcessing] = useState(false);

  console.log('[Payment] User profile:', userProfile ? {
    id: userProfile.id,
    email: userProfile.email,
    userType: userProfile.userType
  } : 'null');

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

  const handleSimulatedPayment = async () => {
    console.log('[Payment] Starting simulated payment process...');
    console.log('[Payment] User profile:', {
      id: userProfile.id,
      email: userProfile.email,
      userType: userProfile.userType
    });
    
    setProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Update local profile to mark subscription as active
      const updatedProfile = {
        ...userProfile,
        subscriptionActive: true,
      };
      
      setUserProfile(updatedProfile);
      
      // Save to AsyncStorage
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('doula_connect_subscription_active', 'true');
      console.log('[Payment] Subscription marked as active in local storage');
      
      console.log('[Payment] Simulated payment successful!');
      
      Alert.alert(
        'Payment Successful',
        'Your subscription is now active! You have full access to all app features.',
        [
          {
            text: 'Continue',
            onPress: () => {
              console.log('[Payment] Navigating to Connect screen');
              router.replace('/(tabs)/connect');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('[Payment] Error during simulated payment:', error);
      Alert.alert(
        'Error',
        'An error occurred while activating your subscription. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => setProcessing(false)
          }
        ]
      );
    }
  };

  const handleSkipPayment = () => {
    console.log('[Payment] User chose to skip payment');
    Alert.alert(
      'Skip Payment',
      'Are you sure you want to skip payment and access the app with full features?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Skip & Continue',
          onPress: async () => {
            try {
              // Update local profile to mark subscription as active
              const updatedProfile = {
                ...userProfile,
                subscriptionActive: true,
              };
              
              setUserProfile(updatedProfile);
              
              // Save to AsyncStorage
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              await AsyncStorage.setItem('doula_connect_subscription_active', 'true');
              console.log('[Payment] Subscription marked as active (skipped payment)');
              
              router.replace('/(tabs)/connect');
            } catch (error: any) {
              console.error('[Payment] Error skipping payment:', error);
              Alert.alert('Error', 'Failed to skip payment. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="checkmark.circle"
            android_material_icon_name="check-circle"
            size={64}
            color={colors.success}
          />
          <Text style={commonStyles.title}>Payment Simulation</Text>
          <Text style={styles.subtitle}>
            Payment integration is temporarily disabled. You can simulate payment or skip to access all features.
          </Text>
        </View>

        <View style={[commonStyles.card, styles.demoNotice]}>
          <IconSymbol
            ios_icon_name="info.circle"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <View style={styles.demoNoticeText}>
            <Text style={styles.demoNoticeTitle}>Demo Mode Active</Text>
            <Text style={styles.demoNoticeSubtitle}>
              Payment processing is currently disabled. You can proceed without payment to test all app features.
            </Text>
          </View>
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

          <View style={styles.demoTag}>
            <Text style={styles.demoTagText}>SIMULATED - NO ACTUAL CHARGE</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[commonStyles.button, processing && styles.buttonDisabled]}
          onPress={handleSimulatedPayment}
          disabled={processing}
        >
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check-circle"
            size={20}
            color="#FFFFFF"
          />
          <Text style={[commonStyles.buttonText, { marginLeft: 8 }]}>
            {processing ? 'Processing...' : 'Simulate Payment & Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.outlineButton, { marginTop: 12 }]}
          onPress={handleSkipPayment}
          disabled={processing}
        >
          <Text style={commonStyles.outlineButtonText}>Skip Payment & Access App</Text>
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
            ios_icon_name="lightbulb"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            This is a temporary solution to enable full app access while payment integration is being configured. All features are available without payment.
          </Text>
        </View>
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
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  demoNoticeText: {
    marginLeft: 12,
    flex: 1,
  },
  demoNoticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  demoNoticeSubtitle: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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
  demoTag: {
    backgroundColor: colors.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  demoTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
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
    borderLeftColor: colors.primary,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
