
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { ErrorModal } from '@/components/ConfirmModal';

export default function PaymentScreen() {
  console.log('[Payment] Screen mounted - Web version (In-App Purchase not available on web)');
  const router = useRouter();
  const { userProfile } = useUser();
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
  const subscriptionFee = '99.99';
  const subscriptionPeriod = isParent ? 'Annual' : 'Monthly';

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

        <View style={styles.webNoticeContainer}>
          <IconSymbol
            ios_icon_name="info.circle"
            android_material_icon_name="info"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.webNoticeTitle}>Mobile App Required</Text>
          <Text style={styles.webNoticeSubtitle}>
            Subscriptions are only available through the iOS or Android mobile app. Please download the Doula Connect app from the App Store or Google Play to subscribe.
          </Text>
          <View style={styles.storeLinksContainer}>
            <View style={styles.storeLinkBox}>
              <IconSymbol
                ios_icon_name="apple.logo"
                android_material_icon_name="phone-iphone"
                size={32}
                color={colors.text}
              />
              <Text style={styles.storeLinkText}>Download on the App Store</Text>
            </View>
            <View style={styles.storeLinkBox}>
              <IconSymbol
                ios_icon_name="play.circle"
                android_material_icon_name="phone-android"
                size={32}
                color={colors.text}
              />
              <Text style={styles.storeLinkText}>Get it on Google Play</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[commonStyles.outlineButton, { marginTop: 24 }]}
          onPress={() => router.back()}
        >
          <Text style={commonStyles.outlineButtonText}>Back</Text>
        </TouchableOpacity>
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
  webNoticeContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  webNoticeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  webNoticeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  storeLinksContainer: {
    marginTop: 24,
    width: '100%',
  },
  storeLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storeLinkText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
