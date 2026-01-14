import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getStripeStatus } from '../services/stripe-service.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Application status endpoint
   * Returns application status including Stripe configuration
   */
  fastify.get('/status', {
    schema: {
      description: 'Get application status and service configuration',
      tags: ['status'],
      response: {
        200: {
          description: 'Application status',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string', enum: ['ready', 'unavailable'] },
                stripe: {
                  type: 'object',
                  properties: {
                    initialized: { type: 'boolean' },
                    available: { type: 'boolean' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const stripeStatus = getStripeStatus();

    // Determine overall status
    const isHealthy = stripeStatus.available;
    const status = isHealthy ? 'healthy' : 'degraded';

    await reply.status(isHealthy ? 200 : 200).send({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: 'ready',
        stripe: {
          initialized: stripeStatus.initialized,
          available: stripeStatus.available,
          error: stripeStatus.error || undefined,
        },
      },
    });
  });

  /**
   * Status endpoint for Stripe configuration
   * Returns detailed information about Stripe setup
   */
  fastify.get('/status/stripe', {
    schema: {
      description: 'Get Stripe payment service status',
      tags: ['status'],
      response: {
        200: {
          description: 'Stripe service status',
          type: 'object',
          properties: {
            initialized: { type: 'boolean' },
            available: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const stripeStatus = getStripeStatus();

    let message = '';
    if (stripeStatus.available) {
      message = 'Stripe payment processing is operational';
    } else if (stripeStatus.initialized && !stripeStatus.available) {
      message = `Stripe is not available: ${stripeStatus.error}`;
    } else {
      message = 'Stripe service has not been initialized';
    }

    await reply.status(200).send({
      initialized: stripeStatus.initialized,
      available: stripeStatus.available,
      error: stripeStatus.error,
      message,
    });
  });
}
