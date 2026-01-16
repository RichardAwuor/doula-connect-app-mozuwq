import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPayPalStatus } from '../services/paypal-service.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Application status endpoint
   * Returns application status including PayPal configuration
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
                paypal: {
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
    const paypalStatus = getPayPalStatus();

    // Determine overall status
    const isHealthy = paypalStatus.available;
    const status = isHealthy ? 'healthy' : 'degraded';

    await reply.status(isHealthy ? 200 : 200).send({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: 'ready',
        paypal: {
          initialized: paypalStatus.initialized,
          available: paypalStatus.available,
          error: paypalStatus.error || undefined,
        },
      },
    });
  });

  /**
   * Status endpoint for PayPal configuration
   * Returns detailed information about PayPal setup
   */
  fastify.get('/status/paypal', {
    schema: {
      description: 'Get PayPal payment service status',
      tags: ['status'],
      response: {
        200: {
          description: 'PayPal service status',
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
    const paypalStatus = getPayPalStatus();

    let message = '';
    if (paypalStatus.available) {
      message = 'PayPal payment processing is operational';
    } else if (paypalStatus.initialized && !paypalStatus.available) {
      message = `PayPal is not available: ${paypalStatus.error}`;
    } else {
      message = 'PayPal service has not been initialized';
    }

    await reply.status(200).send({
      initialized: paypalStatus.initialized,
      available: paypalStatus.available,
      error: paypalStatus.error,
      message,
    });
  });
}
