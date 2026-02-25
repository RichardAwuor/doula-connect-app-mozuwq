import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface VerifyIAPRequest {
  userId: string;
  receipt: string;
  platform: 'ios' | 'android';
  productId: string;
}

interface RestorePurchasesRequest {
  userId: string;
  platform: 'ios' | 'android';
}

interface SubscriptionStatusParams {
  userId: string;
}

interface VerifyIAPResponse {
  success: boolean;
  subscriptionId?: string;
  expiresAt?: string;
  error?: string;
}

interface RestorePurchasesResponse {
  success: boolean;
  hasActiveSubscription: boolean;
  subscription?: any;
  error?: string;
}

interface SubscriptionStatusResponse {
  subscription?: any;
  error?: string;
}

// Helper function to verify iOS receipt with App Store Server API
async function verifyIOSReceipt(receipt: string, productId: string): Promise<any> {
  const isProduction = process.env.NODE_ENV === 'production';
  const url = isProduction
    ? 'https://api.storekit.itunes.apple.com/inApps/v1/transactions/lookup/'
    : 'https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions/lookup/';

  try {
    // Note: In production, you would use Apple's JWT token signing with private key
    // For now, we validate the receipt format and return mock verification
    // In reality, you'd need to implement proper JWT signing with your private key
    if (!receipt || receipt.length === 0) {
      throw new Error('Invalid receipt format');
    }

    // Make request to Apple App Store Server API
    // This requires proper JWT authentication with App Store Connect credentials
    const response = await fetch(`${url}${receipt}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.APPLE_APP_STORE_KEY || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Apple verification failed: ${response.statusText}`);
    }

    const data = await response.json() as any;

    // Parse the response to get transaction and expiration info
    if (data.signedTransactionInfo) {
      // Decode the JWT to get transaction details
      return {
        transactionId: data.signedTransactionInfo,
        expiresDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 365 days
        isValid: true,
      };
    }

    return { isValid: false };
  } catch (error) {
    throw new Error(`iOS receipt verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to verify Android purchase token with Google Play Developer API
async function verifyAndroidPurchase(packageName: string, productId: string, token: string): Promise<any> {
  try {
    // Validate token format
    if (!token || token.length === 0) {
      throw new Error('Invalid purchase token format');
    }

    // In production, you would use Google Play Developer API
    // This requires OAuth2 credentials from Google Cloud Console
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/inappPurchases/${productId}/tokens/${token}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_PLAY_ACCESS_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Play verification failed: ${response.statusText}`);
    }

    const data = await response.json() as any;

    // Check if purchase is valid
    if (data.purchaseState === 0) { // 0 = purchased, 1 = cancelled
      return {
        purchaseToken: token,
        expiresDate: new Date(data.expiryTimeMillis),
        isValid: true,
      };
    }

    return { isValid: false };
  } catch (error) {
    throw new Error(`Android purchase verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Verify in-app purchase receipt for iOS or Android
   */
  fastify.post<{ Body: VerifyIAPRequest }>(
    '/api/payments/verify-iap',
    {
      schema: {
        description: 'Verify in-app purchase receipt with Apple or Google',
        tags: ['payments', 'iap'],
        body: {
          type: 'object',
          required: ['userId', 'receipt', 'platform', 'productId'],
          properties: {
            userId: { type: 'string', format: 'uuid', description: 'User ID' },
            receipt: { type: 'string', description: 'App Store receipt or Google Play purchase token' },
            platform: { type: 'string', enum: ['ios', 'android'], description: 'Platform' },
            productId: { type: 'string', description: 'Product ID' },
          },
        },
        response: {
          200: {
            description: 'Purchase verified successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              subscriptionId: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            description: 'Invalid receipt or request',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            description: 'Verification error',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: VerifyIAPRequest }>,
      reply: FastifyReply
    ): Promise<VerifyIAPResponse> => {
      const { userId, receipt, platform, productId } = request.body;
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return { success: false, error: 'Unauthorized' };

      app.logger.info({ userId, platform, productId }, 'Starting IAP verification');

      try {
        // Verify authenticated user matches request userId
        if (session.user.id !== userId) {
          app.logger.warn({ sessionUserId: session.user.id, requestUserId: userId }, 'User ID mismatch');
          return await reply.status(401).send({ success: false, error: 'Unauthorized' });
        }

        // Get user to determine profile type
        const user = await app.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, userId));

        if (user.length === 0) {
          return await reply.status(400).send({
            success: false,
            error: 'User not found',
          });
        }

        // Verify receipt based on platform
        let verificationResult;
        if (platform === 'ios') {
          verificationResult = await verifyIOSReceipt(receipt, productId);
        } else if (platform === 'android') {
          // For Android, we need the package name - could be extracted from productId or passed separately
          const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.doulaapp.parent';
          verificationResult = await verifyAndroidPurchase(packageName, productId, receipt);
        } else {
          return await reply.status(400).send({
            success: false,
            error: 'Invalid platform',
          });
        }

        if (!verificationResult.isValid) {
          return await reply.status(400).send({
            success: false,
            error: 'Invalid or expired receipt',
          });
        }

        // Determine subscription details based on user type
        const userType = user[0].userType;
        const planType = userType === 'doula' ? 'monthly' : 'annual';
        const amount = '99.00';
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date(verificationResult.expiresDate || currentPeriodStart.getTime() + (planType === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000);

        // Check if subscription exists
        const existingSubscription = await app.db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.userId, userId));

        let subscriptionId: string;

        if (existingSubscription.length > 0) {
          // Update existing subscription
          subscriptionId = existingSubscription[0].id;
          const updateData: any = {
            status: 'active',
            planType,
            amount,
            currentPeriodStart,
            currentPeriodEnd,
            platform,
          };

          if (platform === 'ios') {
            updateData.appleTransactionId = verificationResult.transactionId;
          } else {
            updateData.googlePurchaseToken = receipt;
          }

          await app.db
            .update(schema.subscriptions)
            .set(updateData)
            .where(eq(schema.subscriptions.userId, userId));

          app.logger.info({ userId, subscriptionId, platform }, 'Subscription updated');
        } else {
          // Create new subscription
          const insertData: any = {
            userId,
            status: 'active',
            planType,
            amount,
            currentPeriodStart,
            currentPeriodEnd,
            platform,
          };

          if (platform === 'ios') {
            insertData.appleTransactionId = verificationResult.transactionId;
          } else {
            insertData.googlePurchaseToken = receipt;
          }

          const result = await app.db
            .insert(schema.subscriptions)
            .values(insertData)
            .returning({ id: schema.subscriptions.id });

          subscriptionId = result[0].id;
          app.logger.info({ userId, subscriptionId, platform }, 'Subscription created');
        }

        // Update profile to set subscriptionActive to true
        if (userType === 'parent') {
          await app.db
            .update(schema.parentProfiles)
            .set({ subscriptionActive: true })
            .where(eq(schema.parentProfiles.userId, userId));
        } else if (userType === 'doula') {
          await app.db
            .update(schema.doulaProfiles)
            .set({ subscriptionActive: true })
            .where(eq(schema.doulaProfiles.userId, userId));
        }

        app.logger.info({ userId, subscriptionId }, 'Profile subscription activated');

        return await reply.status(200).send({
          success: true,
          subscriptionId,
          expiresAt: currentPeriodEnd.toISOString(),
        });
      } catch (error) {
        app.logger.error(
          { err: error, userId, platform },
          'IAP verification failed'
        );

        return await reply.status(500).send({
          success: false,
          error: 'Verification error. Please try again later.',
        });
      }
    }
  );

  /**
   * Restore previous purchases for user
   */
  fastify.post<{ Body: RestorePurchasesRequest }>(
    '/api/payments/restore-purchases',
    {
      schema: {
        description: 'Restore previous purchases for user on a platform',
        tags: ['payments', 'iap'],
        body: {
          type: 'object',
          required: ['userId', 'platform'],
          properties: {
            userId: { type: 'string', format: 'uuid', description: 'User ID' },
            platform: { type: 'string', enum: ['ios', 'android'], description: 'Platform' },
          },
        },
        response: {
          200: {
            description: 'Restore completed',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              hasActiveSubscription: { type: 'boolean' },
              subscription: { type: 'object' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            description: 'Restore error',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RestorePurchasesRequest }>,
      reply: FastifyReply
    ): Promise<RestorePurchasesResponse> => {
      const { userId, platform } = request.body;
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return { success: false, hasActiveSubscription: false, error: 'Unauthorized' };

      app.logger.info({ userId, platform }, 'Starting restore purchases');

      try {
        // Verify authenticated user matches request userId
        if (session.user.id !== userId) {
          app.logger.warn({ sessionUserId: session.user.id, requestUserId: userId }, 'User ID mismatch');
          return await reply.status(401).send({ success: false, hasActiveSubscription: false, error: 'Unauthorized' });
        }

        // Get current subscription
        const subscription = await app.db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.userId, userId));

        let hasActiveSubscription = false;
        let activeSubscription = null;

        if (subscription.length > 0) {
          const sub = subscription[0];
          const now = new Date();
          const expiresAt = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;

          // Check if subscription is still valid
          if (sub.status === 'active' && expiresAt && expiresAt > now) {
            hasActiveSubscription = true;
            activeSubscription = {
              id: sub.id,
              status: sub.status,
              planType: sub.planType,
              currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
              platform: sub.platform,
            };
          }
        }

        app.logger.info({ userId, hasActiveSubscription }, 'Restore purchases completed');

        const response: RestorePurchasesResponse = {
          success: true,
          hasActiveSubscription,
        };

        if (activeSubscription) {
          response.subscription = activeSubscription;
        }

        return await reply.status(200).send(response);
      } catch (error) {
        app.logger.error(
          { err: error, userId, platform },
          'Restore purchases failed'
        );

        return await reply.status(500).send({
          success: false,
          hasActiveSubscription: false,
          error: 'Restore error. Please try again later.',
        });
      }
    }
  );

  /**
   * Get subscription status for user
   */
  fastify.get<{ Params: SubscriptionStatusParams }>(
    '/api/payments/subscription-status/:userId',
    {
      schema: {
        description: 'Get current subscription status for user',
        tags: ['payments'],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid', description: 'User ID' },
          },
        },
        response: {
          200: {
            description: 'Subscription status retrieved',
            type: 'object',
            properties: {
              subscription: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  planType: { type: 'string' },
                  currentPeriodEnd: { type: 'string', format: 'date-time' },
                  platform: { type: 'string' },
                  autoRenew: { type: 'boolean' },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
            description: 'Subscription not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: SubscriptionStatusParams }>,
      reply: FastifyReply
    ): Promise<SubscriptionStatusResponse> => {
      const { userId } = request.params;
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return { error: 'Unauthorized' };

      app.logger.info({ userId }, 'Fetching subscription status');

      try {
        // Verify authenticated user matches request userId
        if (session.user.id !== userId) {
          app.logger.warn({ sessionUserId: session.user.id, requestUserId: userId }, 'User ID mismatch');
          return await reply.status(401).send({ error: 'Unauthorized' });
        }

        const subscription = await app.db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.userId, userId));

        if (subscription.length === 0) {
          return await reply.status(404).send({
            error: 'No subscription found',
          });
        }

        const sub = subscription[0];
        const now = new Date();
        const expiresAt = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;

        // Determine if subscription is currently active
        const isActive = sub.status === 'active' && expiresAt && expiresAt > now;

        // Auto-renew is true if status is active and subscription hasn't expired
        const autoRenew = isActive;

        const response: SubscriptionStatusResponse = {
          subscription: {
            id: sub.id,
            status: sub.status,
            planType: sub.planType,
            currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
            platform: sub.platform,
            autoRenew,
          },
        };

        app.logger.info({ userId, status: sub.status, isActive }, 'Subscription status retrieved');

        return await reply.status(200).send(response);
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to fetch subscription status'
        );

        return await reply.status(500).send({
          error: 'Failed to fetch subscription status',
        });
      }
    }
  );
}
