import * as checkoutNodeJssdk from '@paypal/checkout-server-sdk';

/**
 * PayPal service for payment processing
 * Validates and manages PayPal client initialization
 */

let paypalClient: checkoutNodeJssdk.core.PayPalHttpClient | null = null;
let paypalInitialized = false;
let paypalError: string | null = null;

/**
 * Mask sensitive credentials for logging - shows first 4 and last 4 characters
 * Example: "APP-1234567890abcdef" becomes "APP-****...cdef"
 */
function maskCredential(credential: string): string {
  if (credential.length <= 8) {
    return '****';
  }
  const first4 = credential.substring(0, 4);
  const last4 = credential.substring(credential.length - 4);
  return `${first4}****...${last4}`;
}

/**
 * Initialize and validate PayPal configuration
 * Should be called during server startup
 */
export function initializePayPal(logger?: any): { success: boolean; error?: string } {
  if (paypalInitialized) {
    return paypalClient ? { success: true } : { success: false, error: paypalError || 'PayPal not initialized' };
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Validate credentials
  if (!clientId || !clientSecret) {
    paypalError = 'PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables are required. Payment processing is disabled.';
    paypalInitialized = true;
    if (logger) {
      logger.error('PayPal initialization failed: Credentials not configured');
    }
    return { success: false, error: paypalError };
  }

  try {
    // Determine environment based on NODE_ENV
    const mode = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    const environment = mode === 'production'
      ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
      : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);

    // Initialize PayPal client
    paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
    paypalInitialized = true;

    if (logger) {
      const maskedClientId = maskCredential(clientId);
      const maskedClientSecret = maskCredential(clientSecret);
      logger.info(
        {
          environment: mode,
          clientId: maskedClientId,
          clientSecret: maskedClientSecret,
        },
        `PayPal client successfully initialized in ${mode} mode`
      );
    }

    return { success: true };
  } catch (error) {
    paypalError = `Failed to initialize PayPal: ${error instanceof Error ? error.message : String(error)}`;
    paypalInitialized = true;
    if (logger) {
      logger.error({ err: error }, 'PayPal initialization failed - unable to create client with provided credentials');
    }
    return { success: false, error: paypalError };
  }
}

/**
 * Get initialized PayPal client
 * Throws error if PayPal is not properly initialized
 */
export function getPayPalClient(): checkoutNodeJssdk.core.PayPalHttpClient {
  if (!paypalInitialized) {
    throw new Error('PayPal service not initialized. Call initializePayPal() during startup.');
  }

  if (!paypalClient) {
    throw new Error(paypalError || 'PayPal client is not available');
  }

  return paypalClient;
}

/**
 * Check if PayPal is available
 */
export function isPayPalAvailable(): boolean {
  return paypalInitialized && paypalClient !== null;
}

/**
 * Get PayPal initialization status
 */
export function getPayPalStatus(): { initialized: boolean; available: boolean; error?: string } {
  return {
    initialized: paypalInitialized,
    available: paypalClient !== null,
    error: paypalError || undefined,
  };
}

/**
 * Get webhook verification token
 */
export function getWebhookVerificationToken(): string | null {
  return process.env.PAYPAL_WEBHOOK_ID || null;
}
