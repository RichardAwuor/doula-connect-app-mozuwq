
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

export default function PayPalDiagnosticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('PayPal Diagnostics: Screen mounted, fetching status...');
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    console.log('PayPal Diagnostics: Fetching backend status...');
    try {
      setError(null);
      const response = await apiGet('/status');
      console.log('PayPal Diagnostics: Status response received:', JSON.stringify(response, null, 2));
      setStatus(response);
    } catch (err) {
      console.error('PayPal Diagnostics: Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('PayPal Diagnostics: User triggered refresh');
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
          <TouchableOpacity
            onPress={() => {
              console.log('PayPal Diagnostics: User tapped back button');
              router.back();
            }}
            style={styles.backButton}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PayPal Diagnostics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading diagnostics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            console.log('PayPal Diagnostics: User tapped back button');
            router.back();
          }}
          style={styles.backButton}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PayPal Diagnostics</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="warning"
              size={48}
              color="#F44336"
            />
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                console.log('PayPal Diagnostics: User tapped retry button');
                setLoading(true);
                fetchStatus();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : status ? (
          <>
            {/* Overall Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Backend Status</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Overall Status:</Text>
                <View style={styles.statusBadge}>
                  <Text
                    style={[
                      styles.statusValue,
                      { color: status.status === 'healthy' ? '#4CAF50' : '#FF9800' },
                    ]}
                  >
                    {status.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Database:</Text>
                <View style={styles.statusBadge}>
                  <Text
                    style={[
                      styles.statusValue,
                      { color: status.services.database === 'ready' ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    {status.services.database.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* PayPal Configuration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PayPal Configuration</Text>
              
              <View style={styles.diagnosticCard}>
                <View style={styles.diagnosticHeader}>
                  <IconSymbol
                    ios_icon_name={status.services.paypal.initialized ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={getStatusIcon(status.services.paypal.initialized)}
                    size={32}
                    color={getStatusColor(status.services.paypal.initialized)}
                  />
                  <Text style={styles.diagnosticTitle}>Initialization</Text>
                </View>
                <Text style={styles.diagnosticValue}>
                  {status.services.paypal.initialized ? 'Completed' : 'Not Initialized'}
                </Text>
              </View>

              <View style={styles.diagnosticCard}>
                <View style={styles.diagnosticHeader}>
                  <IconSymbol
                    ios_icon_name={status.services.paypal.available ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                    android_material_icon_name={getStatusIcon(status.services.paypal.available)}
                    size={32}
                    color={getStatusColor(status.services.paypal.available)}
                  />
                  <Text style={styles.diagnosticTitle}>Service Available</Text>
                </View>
                <Text style={styles.diagnosticValue}>
                  {status.services.paypal.available ? 'Yes - Ready to process payments' : 'No - Cannot process payments'}
                </Text>
              </View>

              {status.services.paypal.clientIdPrefix && (
                <View style={styles.diagnosticCard}>
                  <View style={styles.diagnosticHeader}>
                    <IconSymbol
                      ios_icon_name="key.fill"
                      android_material_icon_name="vpn-key"
                      size={32}
                      color="#2196F3"
                    />
                    <Text style={styles.diagnosticTitle}>Client ID Detected</Text>
                  </View>
                  <Text style={styles.diagnosticValue}>
                    {status.services.paypal.clientIdPrefix}...
                  </Text>
                  <Text style={styles.diagnosticNote}>
                    (First 10 characters shown for security)
                  </Text>
                </View>
              )}

              {status.services.paypal.environment && (
                <View style={styles.diagnosticCard}>
                  <View style={styles.diagnosticHeader}>
                    <IconSymbol
                      ios_icon_name="globe"
                      android_material_icon_name="public"
                      size={32}
                      color="#FF9800"
                    />
                    <Text style={styles.diagnosticTitle}>Environment</Text>
                  </View>
                  <Text style={styles.diagnosticValue}>
                    {status.services.paypal.environment}
                  </Text>
                </View>
              )}

              {status.services.paypal.error && (
                <View style={[styles.diagnosticCard, styles.errorCard]}>
                  <View style={styles.diagnosticHeader}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.triangle.fill"
                      android_material_icon_name="error"
                      size={32}
                      color="#F44336"
                    />
                    <Text style={[styles.diagnosticTitle, { color: '#F44336' }]}>Error Details</Text>
                  </View>
                  <Text style={styles.errorDetailText}>
                    {status.services.paypal.error}
                  </Text>
                </View>
              )}

              {status.services.paypal.message && (
                <View style={styles.diagnosticCard}>
                  <View style={styles.diagnosticHeader}>
                    <IconSymbol
                      ios_icon_name="info.circle.fill"
                      android_material_icon_name="info"
                      size={32}
                      color="#2196F3"
                    />
                    <Text style={styles.diagnosticTitle}>Message</Text>
                  </View>
                  <Text style={styles.diagnosticValue}>
                    {status.services.paypal.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Expected Configuration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expected Configuration</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Environment Variables Required:</Text>
                <Text style={styles.infoText}>• PAYPAL_CLIENT_ID</Text>
                <Text style={styles.infoText}>• PAYPAL_CLIENT_SECRET</Text>
                <Text style={styles.infoText}>• PAYPAL_WEBHOOK_ID (optional)</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Your Credentials:</Text>
                <Text style={styles.infoText}>Client ID: AU5OPdLj48...</Text>
                <Text style={styles.infoText}>Secret: EFem4fJaba...</Text>
              </View>
            </View>

            {/* Troubleshooting */}
            {!status.services.paypal.available && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Troubleshooting Steps</Text>
                <View style={styles.troubleshootCard}>
                  <Text style={styles.troubleshootStep}>1. Verify environment variables are set in backend/.env</Text>
                  <Text style={styles.troubleshootStep}>2. Restart the backend server after setting variables</Text>
                  <Text style={styles.troubleshootStep}>3. Check backend logs for initialization errors</Text>
                  <Text style={styles.troubleshootStep}>4. Ensure credentials are from PayPal Sandbox or Live account</Text>
                </View>
              </View>
            )}

            <View style={styles.timestampContainer}>
              <Text style={styles.timestamp}>
                Last updated: {new Date(status.timestamp).toLocaleString()}
              </Text>
            </View>
          </>
        ) : null}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  diagnosticCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  diagnosticTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  diagnosticValue: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  diagnosticNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  errorDetailText: {
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  troubleshootCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
  },
  troubleshootStep: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 8,
    lineHeight: 20,
  },
  timestampContainer: {
    padding: 16,
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
