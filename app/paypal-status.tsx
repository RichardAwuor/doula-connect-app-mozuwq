
import { apiGet } from '@/utils/api';
import { colors, commonStyles } from '@/styles/commonStyles';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

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
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('PayPal Status: Screen mounted, fetching status...');
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    console.log('PayPal Status: Fetching backend status...');
    try {
      setError(null);
      const response = await apiGet('/status');
      console.log('PayPal Status: Status response received:', JSON.stringify(response, null, 2));
      setStatus(response);
    } catch (err) {
      console.error('PayPal Status: Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('PayPal Status: User triggered refresh');
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
              console.log('PayPal Status: User tapped back button');
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
          <Text style={styles.headerTitle}>PayPal Status</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            console.log('PayPal Status: User tapped back button');
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
        <Text style={styles.headerTitle}>PayPal Status</Text>
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
                console.log('PayPal Status: User tapped retry button');
                setLoading(true);
                fetchStatus();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : status ? (
          <>
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <IconSymbol
                  ios_icon_name={status.services.paypal.available ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                  android_material_icon_name={getStatusIcon(status.services.paypal.available)}
                  size={64}
                  color={getStatusColor(status.services.paypal.available)}
                />
                <Text style={styles.statusTitle}>
                  {status.services.paypal.available ? 'PayPal Connected' : 'PayPal Not Available'}
                </Text>
              </View>

              <View style={styles.statusDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Initialized:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: getStatusColor(status.services.paypal.initialized) },
                    ]}
                  >
                    {status.services.paypal.initialized ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Available:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: getStatusColor(status.services.paypal.available) },
                    ]}
                  >
                    {status.services.paypal.available ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Backend Status:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: status.status === 'healthy' ? '#4CAF50' : '#FF9800' },
                    ]}
                  >
                    {status.status}
                  </Text>
                </View>
              </View>

              {status.services.paypal.error && (
                <View style={styles.errorBox}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="error"
                    size={24}
                    color="#F44336"
                  />
                  <Text style={styles.errorBoxText}>{status.services.paypal.error}</Text>
                </View>
              )}
            </View>

            {/* Diagnostics Button */}
            <TouchableOpacity
              style={styles.diagnosticsButton}
              onPress={() => {
                console.log('PayPal Status: User tapped diagnostics button');
                router.push('/paypal-diagnostics');
              }}
            >
              <IconSymbol
                ios_icon_name="wrench.and.screwdriver.fill"
                android_material_icon_name="build"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.diagnosticsButtonText}>View Detailed Diagnostics</Text>
            </TouchableOpacity>

            {!status.services.paypal.available && (
              <View style={styles.helpCard}>
                <Text style={styles.helpTitle}>Configuration Required</Text>
                <Text style={styles.helpText}>
                  PayPal payment processing is not available. Please ensure the following environment
                  variables are set in your backend:
                </Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>PAYPAL_CLIENT_ID=your_client_id</Text>
                  <Text style={styles.codeText}>PAYPAL_CLIENT_SECRET=your_secret</Text>
                </View>
                <Text style={styles.helpText}>
                  After setting these variables, restart the backend server.
                </Text>
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
  statusCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    ...commonStyles.shadow,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  statusDetails: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.text,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorBoxText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    ...commonStyles.shadow,
  },
  diagnosticsButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333333',
    marginBottom: 4,
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
