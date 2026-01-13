import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface RegisterRequest {
  email: string;
  userType: 'parent' | 'doula';
}

interface ParentRegisterRequest extends RegisterRequest {
  firstName: string;
  lastName: string;
  state: string;
  town: string;
  zipCode: string;
  serviceCategories: string[]; // ['birth', 'postpartum']
  financingType: string[]; // ['self', 'carrot', 'medicaid']
  preferredLanguages?: string[];
}

interface DoulaRegisterRequest extends RegisterRequest {
  firstName: string;
  lastName: string;
  state: string;
  town: string;
  zipCode: string;
  paymentPreferences: string[]; // ['self', 'carrot', 'medicaid']
  driveDistance: number;
  spokenLanguages: string[];
  hourlyRateMin: number;
  hourlyRateMax: number;
  serviceCategories: string[]; // ['birth', 'postpartum']
  certifications: string[];
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Register a parent user
   */
  fastify.post('/auth/register-parent', {
    schema: {
      description: 'Register a new parent user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'firstName', 'lastName', 'state', 'town', 'zipCode', 'serviceCategories', 'financingType'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          state: { type: 'string' },
          town: { type: 'string' },
          zipCode: { type: 'string' },
          serviceCategories: { type: 'array', items: { type: 'string' } },
          financingType: { type: 'array', items: { type: 'string' } },
          preferredLanguages: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        201: {
          description: 'Parent registered successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            userId: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid request',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        409: {
          description: 'Email already registered',
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
    request: FastifyRequest<{ Body: ParentRegisterRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const {
      email,
      firstName,
      lastName,
      state,
      town,
      zipCode,
      serviceCategories,
      financingType,
      preferredLanguages = [],
    } = request.body;

    // Validate input
    if (!email || !email.includes('@')) {
      await reply.status(400).send({ error: 'Invalid email address' });
      return;
    }

    if (!firstName || !lastName || !state || !town || !zipCode) {
      await reply.status(400).send({ error: 'Missing required fields' });
      return;
    }

    if (!Array.isArray(serviceCategories) || serviceCategories.length === 0) {
      await reply.status(400).send({ error: 'At least one service category is required' });
      return;
    }

    if (!Array.isArray(financingType) || financingType.length === 0) {
      await reply.status(400).send({ error: 'At least one financing type is required' });
      return;
    }

    try {
      // Check if email already exists
      const existingUser = await app.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser.length > 0) {
        await reply.status(409).send({ error: 'Email already registered' });
        return;
      }

      // Create user and profile in a transaction
      const result = await app.db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(schema.users)
          .values({
            email,
            userType: 'parent',
          })
          .returning();

        await tx
          .insert(schema.parentProfiles)
          .values({
            userId: newUser.id,
            firstName,
            lastName,
            state,
            town,
            zipCode,
            serviceCategories,
            financingType,
            preferredLanguages,
          });

        return newUser;
      });

      app.logger.info(`Parent user registered: ${email}`);

      await reply.status(201).send({
        success: true,
        message: 'Parent registered successfully',
        userId: result.id,
      });
    } catch (error) {
      app.logger.error(`Error registering parent: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({
        error: 'Failed to register parent',
      });
    }
  });

  /**
   * Register a doula user
   */
  fastify.post('/auth/register-doula', {
    schema: {
      description: 'Register a new doula user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'firstName', 'lastName', 'state', 'town', 'zipCode', 'paymentPreferences', 'driveDistance', 'spokenLanguages', 'hourlyRateMin', 'hourlyRateMax', 'serviceCategories', 'certifications'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          state: { type: 'string' },
          town: { type: 'string' },
          zipCode: { type: 'string' },
          paymentPreferences: { type: 'array', items: { type: 'string' } },
          driveDistance: { type: 'number' },
          spokenLanguages: { type: 'array', items: { type: 'string' } },
          hourlyRateMin: { type: 'number' },
          hourlyRateMax: { type: 'number' },
          serviceCategories: { type: 'array', items: { type: 'string' } },
          certifications: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        201: {
          description: 'Doula registered successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            userId: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid request',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        409: {
          description: 'Email already registered',
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
    request: FastifyRequest<{ Body: DoulaRegisterRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const {
      email,
      firstName,
      lastName,
      state,
      town,
      zipCode,
      paymentPreferences,
      driveDistance,
      spokenLanguages,
      hourlyRateMin,
      hourlyRateMax,
      serviceCategories,
      certifications,
    } = request.body;

    // Validate input
    if (!email || !email.includes('@')) {
      await reply.status(400).send({ error: 'Invalid email address' });
      return;
    }

    if (!firstName || !lastName || !state || !town || !zipCode) {
      await reply.status(400).send({ error: 'Missing required fields' });
      return;
    }

    if (!Array.isArray(paymentPreferences) || paymentPreferences.length === 0) {
      await reply.status(400).send({ error: 'At least one payment preference is required' });
      return;
    }

    if (!driveDistance || driveDistance <= 0) {
      await reply.status(400).send({ error: 'Drive distance must be a positive number' });
      return;
    }

    if (!Array.isArray(spokenLanguages) || spokenLanguages.length === 0) {
      await reply.status(400).send({ error: 'At least one language is required' });
      return;
    }

    if (!hourlyRateMin || !hourlyRateMax || hourlyRateMin < 0 || hourlyRateMax < hourlyRateMin) {
      await reply.status(400).send({ error: 'Invalid hourly rates' });
      return;
    }

    if (!Array.isArray(serviceCategories) || serviceCategories.length === 0) {
      await reply.status(400).send({ error: 'At least one service category is required' });
      return;
    }

    if (!Array.isArray(certifications) || certifications.length === 0) {
      await reply.status(400).send({ error: 'At least one certification is required' });
      return;
    }

    try {
      // Check if email already exists
      const existingUser = await app.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser.length > 0) {
        await reply.status(409).send({ error: 'Email already registered' });
        return;
      }

      // Create user and profile in a transaction
      const result = await app.db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(schema.users)
          .values({
            email,
            userType: 'doula',
          })
          .returning();

        await tx
          .insert(schema.doulaProfiles)
          .values({
            userId: newUser.id,
            firstName,
            lastName,
            state,
            town,
            zipCode,
            paymentPreferences,
            driveDistance,
            spokenLanguages,
            hourlyRateMin: hourlyRateMin.toString(),
            hourlyRateMax: hourlyRateMax.toString(),
            serviceCategories,
            certifications,
          });

        return newUser;
      });

      app.logger.info(`Doula user registered: ${email}`);

      await reply.status(201).send({
        success: true,
        message: 'Doula registered successfully',
        userId: result.id,
      });
    } catch (error) {
      app.logger.error(`Error registering doula: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({
        error: 'Failed to register doula',
      });
    }
  });
}
