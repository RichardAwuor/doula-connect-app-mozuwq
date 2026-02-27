
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
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { apiGet } from '@/utils/api';

interface PayPalDiagnostics {
  initialized: boolean;
  available: boolean;
  error?: string;
  message?: string;
  clientIdPrefix?: string;
  environment?: string;
}

interface AppStatus {
  status: string;
  timestamp: string;
  services: {
    database: string;
    paypal: PayPalDiagnostics;
  };
}

export default function PaymentDiagnosticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setError(null);
      console.log('[Payment Diagnostics] Fetching backend status...');
      
      const response = await apiGet('/status');
      console.log('[Payment Diagnostics] Status response:', response);
      
      setStatus(response);
    } catch (err: any) {
      console.error('[Payment Diagnostics] Failed to fetch status:', err);
      setError(err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? colors.success : colors.error;
  };

  const getStatusIcon = (isAvailable: boolean) => {
    return isAvailable ? 'check-circle' : 'error';
  };

  const paypalStatusText = status?.services.paypal.available 
    ? 'Available' 
    : 'Not Available';
  const paypalStatusColor = getStatusColor(status?.services.paypal.available || false);
  const paypalStatusIcon = getStatusIcon(status?.services.paypal.available || false);

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="wrench.and.screwdriver"
            android_material_icon_name="settings"
            size={64}
            color={colors.primary}
          />
          <Text style={commonStyles.title}>Payment Diagnostics</Text>
          <Text style={styles.subtitle}>
            Check PayPal service configuration and status
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading diagnostics...</Text>
          </View>
        ) : error ? (
          <View style={commonStyles.card}>
            <View style={styles.errorHeader}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle"
                android_material_icon_name="warning"
                size={32}
                color={colors.error}
              />
              <Text style={styles.errorTitle}>Connection Error</Text>
            </View>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={[commonStyles.button, { marginTop: 16 }]}
              onPress={fetchStatus}
            >
              <Text style={commonStyles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : status ? (
          <>
            <View style={commonStyles.card}>
              <Text style={commonStyles.subtitle}>Backend Status</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Overall Status:</Text>
                <Text style={[styles.statusValue, { color: colors.success }]}>
                  {status.status}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Timestamp:</Text>
                <Text style={styles.statusValue}>
                  {new Date(status.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={commonStyles.card}>
              <View style={styles.serviceHeader}>
                <Text style={commonStyles.subtitle}>PayPal Service</Text>
                <View style={[styles.statusBadge, { backgroundColor: paypalStatusColor }]}>
                  <IconSymbol
                    ios_icon_name={status.services.paypal.available ? 'checkmark.circle' : 'xmark.circle'}
                    android_material_icon_name={paypalStatusIcon}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.statusBadgeText}>{paypalStatusText}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Initialized:</Text>
                <Text style={styles.detailValue}>
                  {status.services.paypal.initialized ? 'Yes' : 'No'}
                </Text>
              </View>

              {status.services.paypal.environment && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Environment:</Text>
                  <Text style={[styles.detailValue, styles.environmentBadge]}>
                    {status.services.paypal.environment.toUpperCase()}
                  </Text>
                </View>
              )}

              {status.services.paypal.clientIdPrefix && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client ID Prefix:</Text>
                  <Text style={[styles.detailValue, styles.monospace]}>
                    {status.services.paypal.clientIdPrefix}...
                  </Text>
                </View>
              )}

              {status.services.paypal.error && (
                <View style={styles.errorBox}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.triangle"
                    android_material_icon_name="warning"
                    size={20}
                    color={colors.error}
                  />
                  <Text style={styles.errorBoxText}>
                    {status.services.paypal.error}
                  </Text>
                </View>
              )}

              {status.services.paypal.message && (
                <View style={styles.infoBox}>
                  <IconSymbol
                    ios_icon_name="info.circle"
                    android_material_icon_name="info"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.infoBoxText}>
                    {status.services.paypal.message}
                  </Text>
                </View>
              )}
            </View>

            {!status.services.paypal.available && (
              <View style={commonStyles.card}>
                <Text style={[commonStyles.subtitle, { color: colors.error }]}>
                  Configuration Required
                </Text>
                <Text style={styles.helpText}>
                  PayPal payment processing is currently unavailable. The following environment variables must be configured on the backend server:
                </Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>PAYPAL_CLIENT_ID</Text>
                  <Text style={styles.codeText}>PAYPAL_CLIENT_SECRET</Text>
                </View>
                <Text style={styles.helpText}>
                  Please contact your system administrator to configure these credentials.
                </Text>
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity
          style={[commonStyles.outlineButton, { marginTop: 24 }]}
          onPress={() => router.back()}
        >
          <Text style={commonStyles.outlineButtonText}>Back</Text>
        </TouchableOpacity>
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
  loadingContainer: {
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
    marginLeft: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
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
  environmentBadge: {
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  monospace: {
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.error + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorBoxText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.error,
    flex: 1,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoBoxText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  codeBlock: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
});
