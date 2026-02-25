
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';

export default function PaymentCancelledScreen() {
  console.log('[Payment Cancelled] Screen mounted');
  const router = useRouter();

  useEffect(() => {
    console.log('[Payment Cancelled] User cancelled payment');
  }, []);

  const handleRetry = () => {
    console.log('[Payment Cancelled] User chose to retry payment');
    router.replace('/payment');
  };

  const handleGoBack = () => {
    console.log('[Payment Cancelled] User chose to go back');
    router.back();
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={[commonStyles.container, styles.content]}>
        <IconSymbol
          ios_icon_name="xmark.circle"
          android_material_icon_name="cancel"
          size={80}
          color={colors.error}
        />
        
        <Text style={[commonStyles.title, styles.title]}>
          Payment Cancelled
        </Text>
        
        <Text style={styles.message}>
          Your payment was cancelled. No charges were made to your account.
        </Text>

        <TouchableOpacity
          style={[commonStyles.button, styles.button]}
          onPress={handleRetry}
        >
          <Text style={commonStyles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.outlineButton, styles.button]}
          onPress={handleGoBack}
        >
          <Text style={commonStyles.outlineButtonText}>Go Back</Text>
        </TouchableOpacity>
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
    marginBottom: 32,
  },
  button: {
    marginTop: 12,
    width: '100%',
  },
});
