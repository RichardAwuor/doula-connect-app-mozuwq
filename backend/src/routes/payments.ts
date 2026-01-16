import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { getPayPalClient, isPayPalAvailable, getPayPalStatus, getWebhookVerificationToken } from '../services/paypal-service.js';
import * as checkoutNodeJssdk from '@paypal/checkout-server-sdk';

// Pricing constants (in dollars)
const PARENT_ANNUAL_PRICE = '99.00';
const DOULA_MONTHLY_PRICE = '99.00';

interface CreatePaymentSessionRequest {
  userId: string;
  userType: 'parent' | 'doula';
  planType: 'annual' | 'monthly';
  email: string;
}

interface GetSubscriptionParams {
  userId: string;
}

interface UpdateSubscriptionRequest {
  status: 'active' | 'cancelled' | 'expired';
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Create a payment session (PayPal order) for subscription
   */
  fastify.post('/payments/create-session', {
    schema: {
      description: 'Create a PayPal order for subscription',
      tags: ['payments'],
      body: {
        type: 'object',
        required: ['userId', 'userType', 'planType', 'email'],
        properties: {
          userId: { type: 'string' },
          userType: { type: 'string', enum: ['parent', 'doula'] },
          planType: { type: 'string', enum: ['annual', 'monthly'] },
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          description: 'PayPal order created',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            orderId: { type: 'string' },
            approvalUrl: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid request',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        503: {
          description: 'Service unavailable',
          type: 'object',
          properties: { error: { type: 'string' }, details: { type: 'string' } },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: { error: { type: 'string' }, details: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: CreatePaymentSessionRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId, userType, planType, email } = request.body;

    app.logger.info({ userId, userType, planType, email }, 'PayPal order requested');

    if (!userId || !userType || !planType || !email) {
      app.logger.warn({ userId, userType, planType, email }, 'Missing required fields in payment request');
      await reply.status(400).send({ error: 'Missing required fields' });
      return;
    }

    try {
      // Check if PayPal is available
      if (!isPayPalAvailable()) {
        const paypalStatus = getPayPalStatus();
        app.logger.error({ paypalStatus }, 'PayPal service is not available - payment processing is disabled');
        await reply.status(503).send({
          error: 'Payment processing is currently unavailable. PayPal credentials not configured.',
          details: paypalStatus.error,
        });
        return;
      }

      // Validate plan type based on user type
      if (userType === 'parent' && planType !== 'annual') {
        await reply.status(400).send({ error: 'Parents must choose annual plan' });
        return;
      }

      if (userType === 'doula' && planType !== 'monthly') {
        await reply.status(400).send({ error: 'Doulas must choose monthly plan' });
        return;
      }

      const price = userType === 'parent' ? PARENT_ANNUAL_PRICE : DOULA_MONTHLY_PRICE;
      const planName = userType === 'parent' ? 'Parent Annual Plan ($99/year)' : 'Doula Monthly Plan ($99/month)';
      const description = userType === 'parent'
        ? 'Annual subscription to Doula Connect platform for parents'
        : 'Monthly subscription to Doula Connect platform for doulas';

      app.logger.info(
        { userType, planType, price, planName, email },
        'Creating PayPal order'
      );

      const paypalClient = getPayPalClient();
      const orderRequest = new checkoutNodeJssdk.orders.OrdersCreateRequest();

      orderRequest.headers['prefer'] = 'return=representation';
      orderRequest.body = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: userId,
            amount: {
              currency_code: 'USD',
              value: price,
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: price,
                },
              },
            },
            items: [
              {
                name: planName,
                description: description,
                sku: userType === 'parent' ? 'PARENT_ANNUAL' : 'DOULA_MONTHLY',
                unit_amount: {
                  currency_code: 'USD',
                  value: price,
                },
                quantity: '1',
                category: 'SUBSCRIPTION',
              },
            ],
            custom_id: JSON.stringify({
              userId,
              userType,
              planType,
              email,
            }),
          },
        ],
        payer: {
          email_address: email,
        },
        application_context: {
          brand_name: 'Doula Connect',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?order_id={ORDER_ID}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancelled`,
        },
      };

      const response = await paypalClient.execute(orderRequest);
      const orderId = response.result.id;
      const approvalUrl = response.result.links.find((link: any) => link.rel === 'approve')?.href;

      if (!approvalUrl) {
        throw new Error('No approval URL returned from PayPal');
      }

      app.logger.info(
        { orderId, userId, approvalUrl: approvalUrl.substring(0, 50) },
        'PayPal order created successfully'
      );

      await reply.status(200).send({
        success: true,
        orderId,
        approvalUrl,
      });
    } catch (error) {
      app.logger.error(
        { err: error, userId, userType, planType, email },
        'Failed to create PayPal order'
      );
      await reply.status(500).send({
        error: 'Failed to create payment order',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Handle PayPal webhook events
   */
  fastify.post('/payments/webhook', {
    schema: {
      description: 'Handle PayPal webhook events',
      tags: ['payments'],
      body: {
        type: 'object',
      },
      response: {
        200: {
          description: 'Webhook processed',
          type: 'object',
          properties: {
            received: { type: 'boolean' },
          },
        },
        400: {
          description: 'Invalid webhook',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const webhookId = getWebhookVerificationToken();

    app.logger.info({ webhookId: webhookId?.substring(0, 20) }, 'Webhook received from PayPal');

    try {
      const event = request.body as any;

      // Log webhook event type
      app.logger.info({ eventType: event.event_type, eventId: event.id }, 'Processing PayPal webhook event');

      // Handle CHECKOUT.ORDER.APPROVED event (payment captured successfully)
      if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'CHECKOUT.ORDER.COMPLETED') {
        const orderId = event.resource.id;
        const payer = event.resource.payer;
        const purchaseUnit = event.resource.purchase_units[0];
        const customData = JSON.parse(purchaseUnit.custom_id || '{}');
        const { userId, userType, planType, email } = customData;

        app.logger.info(
          { orderId, userId, userType, planType },
          'Processing order approval'
        );

        // Create or update subscription record
        const amount = userType === 'parent' ? PARENT_ANNUAL_PRICE : DOULA_MONTHLY_PRICE;
        const durationDays = planType === 'annual' ? 365 : 30;

        try {
          await app.db.transaction(async (tx) => {
            const now = new Date();
            const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

            // Check if subscription exists
            const existingSubs = await tx
              .select()
              .from(schema.subscriptions)
              .where(eq(schema.subscriptions.userId, userId));

            if (existingSubs.length > 0) {
              // Update existing subscription
              app.logger.info({ userId, subscriptionId: existingSubs[0].id }, 'Updating existing subscription');
              await tx
                .update(schema.subscriptions)
                .set({
                  paypalCustomerId: payer.payer_id,
                  paypalOrderId: orderId,
                  status: 'active',
                  planType,
                  amount,
                  currentPeriodStart: now,
                  currentPeriodEnd: endDate,
                })
                .where(eq(schema.subscriptions.userId, userId));
            } else {
              // Create new subscription
              app.logger.info({ userId }, 'Creating new subscription');
              await tx
                .insert(schema.subscriptions)
                .values({
                  userId,
                  paypalCustomerId: payer.payer_id as string,
                  paypalOrderId: orderId as string,
                  status: 'active',
                  planType,
                  amount,
                  currentPeriodStart: now,
                  currentPeriodEnd: endDate,
                });
            }

            // Update profile subscription status
            if (userType === 'parent') {
              await tx
                .update(schema.parentProfiles)
                .set({ subscriptionActive: true })
                .where(eq(schema.parentProfiles.userId, userId));
            } else {
              await tx
                .update(schema.doulaProfiles)
                .set({ subscriptionActive: true })
                .where(eq(schema.doulaProfiles.userId, userId));
            }
          });

          app.logger.info({ userId }, 'Subscription activated successfully');
        } catch (txError) {
          app.logger.error({ err: txError, userId }, 'Failed to process subscription activation');
          throw txError;
        }
      }

      // Handle BILLING.SUBSCRIPTION.CANCELLED event
      if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
        const subscriptionId = event.resource.id;
        app.logger.info({ subscriptionId }, 'Processing subscription cancellation');

        const subs = await app.db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.paypalSubscriptionId, subscriptionId));

        if (subs.length > 0) {
          const sub = subs[0];
          app.logger.info({ userId: sub.userId, subscriptionId: sub.id }, 'Found subscription to cancel');

          try {
            await app.db.transaction(async (tx) => {
              // Update subscription status
              await tx
                .update(schema.subscriptions)
                .set({ status: 'cancelled' })
                .where(eq(schema.subscriptions.id, sub.id));

              // Update profile subscription status
              const user = await tx
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, sub.userId));

              if (user.length > 0 && user[0].userType === 'parent') {
                await tx
                  .update(schema.parentProfiles)
                  .set({ subscriptionActive: false })
                  .where(eq(schema.parentProfiles.userId, sub.userId));
              } else if (user.length > 0 && user[0].userType === 'doula') {
                await tx
                  .update(schema.doulaProfiles)
                  .set({ subscriptionActive: false })
                  .where(eq(schema.doulaProfiles.userId, sub.userId));
              }
            });

            app.logger.info({ userId: sub.userId }, 'Subscription cancelled successfully');
          } catch (txError) {
            app.logger.error({ err: txError, userId: sub.userId }, 'Failed to process subscription cancellation');
            throw txError;
          }
        } else {
          app.logger.warn({ subscriptionId }, 'No subscription found for cancellation event');
        }
      }

      await reply.status(200).send({ received: true });
    } catch (error) {
      app.logger.error(
        { err: error },
        'Error processing PayPal webhook'
      );
      await reply.status(400).send({
        error: 'Webhook error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Get subscription status for a user
   */
  fastify.get<{ Params: GetSubscriptionParams }>('/subscriptions/:userId', {
    schema: {
      description: 'Get subscription status for a user',
      tags: ['payments'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Subscription retrieved',
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            planType: { type: 'string' },
            currentPeriodEnd: { type: 'string' },
          },
        },
        404: {
          description: 'Subscription not found',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: GetSubscriptionParams }>, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params;

    app.logger.info({ userId }, 'Fetching subscription status');

    try {
      const subs = await app.db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId));

      if (subs.length === 0) {
        app.logger.info({ userId }, 'Subscription not found');
        await reply.status(404).send({ error: 'Subscription not found' });
        return;
      }

      app.logger.info({ userId, status: subs[0].status }, 'Subscription retrieved successfully');
      await reply.status(200).send(subs[0]);
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Error fetching subscription');
      await reply.status(500).send({ error: 'Failed to fetch subscription' });
    }
  });

  /**
   * Update subscription status
   */
  fastify.put<{ Params: GetSubscriptionParams; Body: UpdateSubscriptionRequest }>('/subscriptions/:userId', {
    schema: {
      description: 'Update subscription status',
      tags: ['payments'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['active', 'cancelled', 'expired'] },
        },
      },
      response: {
        200: {
          description: 'Subscription updated',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: {
          description: 'Subscription not found',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Params: GetSubscriptionParams; Body: UpdateSubscriptionRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId } = request.params;
    const { status } = request.body;

    app.logger.info({ userId, newStatus: status }, 'Updating subscription status');

    try {
      const subs = await app.db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId));

      if (subs.length === 0) {
        app.logger.info({ userId }, 'Subscription not found for update');
        await reply.status(404).send({ error: 'Subscription not found' });
        return;
      }

      const oldStatus = subs[0].status;

      await app.db
        .update(schema.subscriptions)
        .set({ status })
        .where(eq(schema.subscriptions.userId, userId));

      app.logger.info({ userId, oldStatus, newStatus: status }, 'Subscription status updated successfully');

      await reply.status(200).send({
        success: true,
        message: 'Subscription updated successfully',
      });
    } catch (error) {
      app.logger.error({ err: error, userId, newStatus: status }, 'Error updating subscription');
      await reply.status(500).send({ error: 'Failed to update subscription' });
    }
  });
}
