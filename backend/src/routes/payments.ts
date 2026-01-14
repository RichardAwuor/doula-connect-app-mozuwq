import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { getStripeClient, getWebhookSecret, isStripeAvailable } from '../services/stripe-service.js';

// Pricing constants
const PARENT_ANNUAL_PRICE = 9900; // $99 in cents
const DOULA_MONTHLY_PRICE = 9900; // $99 in cents

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
   * Create a payment session for subscription
   */
  fastify.post('/payments/create-session', {
    schema: {
      description: 'Create a payment session for subscription',
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
          description: 'Payment session created',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            sessionId: { type: 'string' },
            clientSecret: { type: 'string' },
            checkoutUrl: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid request',
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
    request: FastifyRequest<{ Body: CreatePaymentSessionRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId, userType, planType, email } = request.body;

    if (!userId || !userType || !planType || !email) {
      await reply.status(400).send({ error: 'Missing required fields' });
      return;
    }

    try {
      // Check if Stripe is available
      if (!isStripeAvailable()) {
        app.logger.error('Stripe service is not available - payment processing is disabled');
        await reply.status(503).send({
          error: 'Payment processing is currently unavailable. Please try again later.',
        });
        return;
      }

      const stripeClient = getStripeClient();

      // Validate plan type based on user type
      if (userType === 'parent' && planType !== 'annual') {
        await reply.status(400).send({ error: 'Parents must choose annual plan' });
        return;
      }

      if (userType === 'doula' && planType !== 'monthly') {
        await reply.status(400).send({ error: 'Doulas must choose monthly plan' });
        return;
      }

      const amount = userType === 'parent' ? PARENT_ANNUAL_PRICE : DOULA_MONTHLY_PRICE;
      const planName = userType === 'parent' ? 'Parent Annual Plan' : 'Doula Monthly Plan';

      // Create Stripe payment session
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planName,
              },
              unit_amount: amount,
              recurring: planType === 'monthly' ? { interval: 'month' } : { interval: 'year' },
            },
            quantity: 1,
          },
        ],
        mode: planType === 'monthly' ? 'subscription' : 'subscription',
        customer_email: email,
        metadata: {
          userId,
          userType,
          planType,
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancelled`,
      });

      app.logger.info(`Payment session created: ${session.id} for user ${userId}`);

      await reply.status(200).send({
        success: true,
        sessionId: session.id,
        clientSecret: session.client_secret,
        checkoutUrl: session.url,
      });
    } catch (error) {
      app.logger.error(`Error creating payment session: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to create payment session' });
    }
  });

  /**
   * Handle payment success webhook
   */
  fastify.post('/payments/webhook', {
    schema: {
      description: 'Handle Stripe webhook for payment success',
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
    const sig = request.headers['stripe-signature'] as string;

    try {
      const stripeClient = getStripeClient();
      const webhookSecret = getWebhookSecret();

      if (!webhookSecret) {
        app.logger.warn('STRIPE_WEBHOOK_SECRET not configured');
        await reply.status(200).send({ received: true });
        return;
      }

      // Get raw body for webhook signature verification
      const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);

      const event = stripeClient.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret
      );

      // Handle checkout session completion
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const { userId, userType, planType } = session.metadata;

        // Create or update subscription record
        const amount = userType === 'parent' ? PARENT_ANNUAL_PRICE : DOULA_MONTHLY_PRICE;
        const durationDays = planType === 'annual' ? 365 : 30;

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
            await tx
              .update(schema.subscriptions)
              .set({
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                status: 'active',
                planType,
                amount: (amount / 100).toString(),
                currentPeriodStart: now,
                currentPeriodEnd: endDate,
              })
              .where(eq(schema.subscriptions.userId, userId));
          } else {
            // Create new subscription
            await tx
              .insert(schema.subscriptions)
              .values({
                userId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: 'active',
                planType,
                amount: (amount / 100).toString(),
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

        app.logger.info(`Subscription activated for user ${userId}`);
      }

      // Handle subscription cancellation
      if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as any;

        const subs = await app.db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id));

        if (subs.length > 0) {
          const sub = subs[0];

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

          app.logger.info(`Subscription cancelled for user ${sub.userId}`);
        }
      }

      await reply.status(200).send({ received: true });
    } catch (error) {
      app.logger.error(`Error processing webhook: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(400).send({ error: 'Webhook error' });
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

    try {
      const subs = await app.db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId));

      if (subs.length === 0) {
        await reply.status(404).send({ error: 'Subscription not found' });
        return;
      }

      await reply.status(200).send(subs[0]);
    } catch (error) {
      app.logger.error(`Error fetching subscription: ${error instanceof Error ? error.message : String(error)}`);
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

    try {
      const subs = await app.db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId));

      if (subs.length === 0) {
        await reply.status(404).send({ error: 'Subscription not found' });
        return;
      }

      await app.db
        .update(schema.subscriptions)
        .set({ status })
        .where(eq(schema.subscriptions.userId, userId));

      app.logger.info(`Subscription status updated: ${userId} -> ${status}`);

      await reply.status(200).send({
        success: true,
        message: 'Subscription updated successfully',
      });
    } catch (error) {
      app.logger.error(`Error updating subscription: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to update subscription' });
    }
  });
}
