
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import { apiGet } from '@/utils/api';

interface PayPalStatus {
  initialized: boolean;
  available: boolean;
  error?: string;
  message?: string;
}

interface AppStatus {
  status: string;
  timestamp: string;
  services: {
    database: string;
    paypal: {
      initialized: boolean;
      available: boolean;
      error?: string;
    };
  };
}

export default function PayPalStatusScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paypalStatus, setPaypalStatus] = useState<PayPalStatus | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    console.log('Fetching PayPal status...');
    try {
      setError(null);
      
      // Fetch PayPal-specific status
      const paypalResponse = await apiGet('/status/paypal');
      console.log('PayPal status response:', paypalResponse);
      setPaypalStatus(paypalResponse);

      // Fetch overall app status
      const statusResponse = await apiGet('/status');
      console.log('App status response:', statusResponse);
      setAppStatus(statusResponse);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? '#4CAF50' : '#F44336';
  };

  const getStatusIcon = (isAvailable: boolean) => {
    return isAvailable ? 'check-circle' : 'error';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PayPal Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Checking PayPal configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PayPal Status</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <IconSymbol
            ios_icon_name="arrow.clockwise"
            android_material_icon_name="refresh"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="warning"
              size={32}
              color="#F44336"
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {paypalStatus && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="creditcard"
                android_material_icon_name="payment"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>PayPal Service</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Initialized:</Text>
              <View style={styles.statusValue}>
                <IconSymbol
                  ios_icon_name={paypalStatus.initialized ? 'checkmark.circle' : 'xmark.circle'}
                  android_material_icon_name={getStatusIcon(paypalStatus.initialized)}
                  size={20}
                  color={getStatusColor(paypalStatus.initialized)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(paypalStatus.initialized) },
                  ]}
                >
                  {paypalStatus.initialized ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Available:</Text>
              <View style={styles.statusValue}>
                <IconSymbol
                  ios_icon_name={paypalStatus.available ? 'checkmark.circle' : 'xmark.circle'}
                  android_material_icon_name={getStatusIcon(paypalStatus.available)}
                  size={20}
                  color={getStatusColor(paypalStatus.available)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(paypalStatus.available) },
                  ]}
                >
                  {paypalStatus.available ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>

            {paypalStatus.error && (
              <View style={styles.errorSection}>
                <Text style={styles.errorSectionTitle}>Error Details:</Text>
                <Text style={styles.errorSectionText}>{paypalStatus.error}</Text>
              </View>
            )}

            {paypalStatus.message && (
              <View style={styles.messageSection}>
                <Text style={styles.messageSectionText}>{paypalStatus.message}</Text>
              </View>
            )}
          </View>
        )}

        {appStatus && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="server.rack"
                android_material_icon_name="dns"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Overall System Status</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      appStatus.status === 'healthy'
                        ? '#4CAF50'
                        : appStatus.status === 'degraded'
                        ? '#FF9800'
                        : '#F44336',
                  },
                ]}
              >
                {appStatus.status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Database:</Text>
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      appStatus.services.database === 'ready' ? '#4CAF50' : '#F44336',
                  },
                ]}
              >
                {appStatus.services.database.toUpperCase()}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Timestamp:</Text>
              <Text style={styles.statusText}>
                {new Date(appStatus.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            This screen shows the current status of the PayPal payment service. If PayPal
            is not available, please ensure that PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET
            environment variables are properly configured in the backend.
          </Text>
        </View>

        {paypalStatus && !paypalStatus.available && (
          <View style={styles.troubleshootCard}>
            <Text style={styles.troubleshootTitle}>Troubleshooting Steps:</Text>
            <Text style={styles.troubleshootStep}>
              1. Verify that PAYPAL_CLIENT_ID is set in backend environment
            </Text>
            <Text style={styles.troubleshootStep}>
              2. Verify that PAYPAL_CLIENT_SECRET is set in backend environment
            </Text>
            <Text style={styles.troubleshootStep}>
              3. Restart the backend server after setting environment variables
            </Text>
            <Text style={styles.troubleshootStep}>
              4. Check backend logs for detailed error messages
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...commonStyles.shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 8,
  },
  errorSectionText: {
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
  },
  messageSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  messageSectionText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  troubleshootCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },
  troubleshootStep: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 24,
    marginLeft: 8,
  },
});
