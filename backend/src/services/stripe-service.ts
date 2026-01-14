import Stripe from 'stripe';

/**
 * Stripe service for payment processing
 * Validates and manages Stripe client initialization
 */

let stripeClient: Stripe | null = null;
let stripeInitialized = false;
let stripeError: string | null = null;

/**
 * Initialize and validate Stripe configuration
 * Should be called during server startup
 */
export function initializeStripe(): { success: boolean; error?: string } {
  if (stripeInitialized) {
    return stripeClient ? { success: true } : { success: false, error: stripeError || 'Stripe not initialized' };
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Validate API key
  if (!apiKey) {
    stripeError = 'STRIPE_SECRET_KEY environment variable is not set';
    stripeInitialized = true;
    return { success: false, error: stripeError };
  }

  // Validate webhook secret (required for production webhooks)
  if (!webhookSecret && process.env.NODE_ENV === 'production') {
    stripeError = 'STRIPE_WEBHOOK_SECRET environment variable is required in production';
    stripeInitialized = true;
    return { success: false, error: stripeError };
  }

  try {
    // Initialize Stripe client with API key
    stripeClient = new Stripe(apiKey);
    stripeInitialized = true;

    return { success: true };
  } catch (error) {
    stripeError = `Failed to initialize Stripe: ${error instanceof Error ? error.message : String(error)}`;
    stripeInitialized = true;
    return { success: false, error: stripeError };
  }
}

/**
 * Get initialized Stripe client
 * Throws error if Stripe is not properly initialized
 */
export function getStripeClient(): Stripe {
  if (!stripeInitialized) {
    throw new Error('Stripe service not initialized. Call initializeStripe() during startup.');
  }

  if (!stripeClient) {
    throw new Error(stripeError || 'Stripe client is not available');
  }

  return stripeClient;
}

/**
 * Check if Stripe is available
 */
export function isStripeAvailable(): boolean {
  return stripeInitialized && stripeClient !== null;
}

/**
 * Get Stripe initialization status
 */
export function getStripeStatus(): { initialized: boolean; available: boolean; error?: string } {
  return {
    initialized: stripeInitialized,
    available: stripeClient !== null,
    error: stripeError || undefined,
  };
}

/**
 * Get webhook secret for verification
 */
export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}
