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
  servicePeriodStart?: string; // ISO 8601 timestamp
  servicePeriodEnd?: string; // ISO 8601 timestamp
  preferredLanguages?: string[];
  desiredDays?: string[];
  desiredStartTime?: string; // ISO 8601 timestamp
  desiredEndTime?: string; // ISO 8601 timestamp
  acceptedTerms?: boolean;
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
  profilePictureUrl?: string;
  certificationDocuments?: Array<{ url: string; type: string }>;
  referees?: Array<{ firstName: string; lastName: string; email: string }>;
  acceptedTerms?: boolean;
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
        required: ['email', 'firstName', 'lastName', 'state', 'town', 'zipCode', 'serviceCategories', 'financingType', 'acceptedTerms'],
        properties: {
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          state: { type: 'string' },
          town: { type: 'string' },
          zipCode: { type: 'string' },
          serviceCategories: { type: 'array', items: { type: 'string' } },
          financingType: { type: 'array', items: { type: 'string' } },
          servicePeriodStart: { type: 'string', format: 'date-time' },
          servicePeriodEnd: { type: 'string', format: 'date-time' },
          preferredLanguages: { type: 'array', items: { type: 'string' } },
          desiredDays: { type: 'array', items: { type: 'string' } },
          desiredStartTime: { type: 'string', format: 'date-time' },
          desiredEndTime: { type: 'string', format: 'date-time' },
          acceptedTerms: { type: 'boolean' },
        },
      },
      response: {
        200: {
          description: 'Parent already registered',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            userId: { type: 'string' },
            message: { type: 'string' },
          },
        },
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
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: ParentRegisterRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const {
        email,
        firstName,
        lastName,
        state,
        town,
        zipCode,
        serviceCategories,
        financingType,
        servicePeriodStart,
        servicePeriodEnd,
        preferredLanguages,
        desiredDays,
        desiredStartTime,
        desiredEndTime,
        acceptedTerms = false,
      } = request.body;

      // Validate required fields
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return await reply.status(400).send({
          success: false,
          error: 'Invalid email address',
        });
      }

      if (!firstName || !lastName || !state || !town || !zipCode) {
        return await reply.status(400).send({
          success: false,
          error: 'Missing required fields: firstName, lastName, state, town, zipCode',
        });
      }

      if (!Array.isArray(serviceCategories) || serviceCategories.length === 0) {
        return await reply.status(400).send({
          success: false,
          error: 'At least one service category is required',
        });
      }

      if (!Array.isArray(financingType) || financingType.length === 0) {
        return await reply.status(400).send({
          success: false,
          error: 'At least one financing type is required',
        });
      }

      if (typeof acceptedTerms !== 'boolean') {
        return await reply.status(400).send({
          success: false,
          error: 'acceptedTerms must be a boolean',
        });
      }

      // Helper function to safely parse timestamp strings
      const parseTimestamp = (value: any): Date | null => {
        if (!value) return null;
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) return null;
          return date;
        } catch {
          return null;
        }
      };

      // Helper function to ensure JSONB array format
      const ensureJsonbArray = (value: any, defaultValue: any[] = []): any[] => {
        if (!value) return defaultValue;
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : defaultValue;
          } catch {
            return defaultValue;
          }
        }
        return defaultValue;
      };

      // Parse timestamp fields safely
      const servicePeriodStartDate = parseTimestamp(servicePeriodStart);
      const servicePeriodEndDate = parseTimestamp(servicePeriodEnd);
      const desiredStartTimeDate = parseTimestamp(desiredStartTime);
      const desiredEndTimeDate = parseTimestamp(desiredEndTime);

      // Ensure JSONB arrays are properly formatted
      const serviceCategoriesToStore = ensureJsonbArray(serviceCategories, []);
      const financingTypeToStore = ensureJsonbArray(financingType, []);
      const preferredLanguagesToStore = ensureJsonbArray(preferredLanguages, []);
      const desiredDaysToStore = ensureJsonbArray(desiredDays, []);

      // Check if email already exists
      const existingUser = await app.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser.length > 0) {
        // Email exists - check if parent profile exists
        const existingParentProfile = await app.db
          .select()
          .from(schema.parentProfiles)
          .where(eq(schema.parentProfiles.userId, existingUser[0].id));

        if (existingParentProfile.length > 0) {
          // Already registered - return 200 so client can proceed to payment
          app.logger.info({ email }, 'Parent already registered, returning existing userId');
          return await reply.status(200).send({
            success: true,
            userId: existingUser[0].id,
            message: 'Already registered',
          });
        }
      }

      // Create user and profile in a transaction
      const result = await app.db.transaction(async (tx) => {
        let userId: string;

        // If user exists but no profile, use existing user
        if (existingUser.length > 0) {
          userId = existingUser[0].id;
        } else {
          // Create new user
          const [newUser] = await tx
            .insert(schema.users)
            .values({
              email,
              userType: 'parent',
            })
            .returning();
          userId = newUser.id;
        }

        // Create parent profile
        const [newProfile] = await tx
          .insert(schema.parentProfiles)
          .values({
            userId,
            firstName,
            lastName,
            state,
            town,
            zipCode,
            serviceCategories: serviceCategoriesToStore,
            financingType: financingTypeToStore,
            servicePeriodStart: servicePeriodStartDate,
            servicePeriodEnd: servicePeriodEndDate,
            preferredLanguages: preferredLanguagesToStore,
            desiredDays: desiredDaysToStore,
            desiredStartTime: desiredStartTimeDate,
            desiredEndTime: desiredEndTimeDate,
            acceptedTerms,
            subscriptionActive: false,
          })
          .returning();

        return { id: userId };
      });

      app.logger.info({ email, userId: result.id }, 'Parent user registered successfully');

      return await reply.status(201).send({
        success: true,
        message: 'Parent registered successfully',
        userId: result.id,
      });
    } catch (error) {
      app.logger.error(
        { err: error, email: request.body?.email },
        'Error registering parent'
      );

      // Always return JSON, never HTML error
      return await reply.status(500).send({
        success: false,
        error: 'Failed to register parent. Please try again later.',
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
          profilePictureUrl: { type: 'string' },
          certificationDocuments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                type: { type: 'string' }
              }
            }
          },
          referees: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' }
              }
            }
          },
          acceptedTerms: { type: 'boolean' },
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
      profilePictureUrl,
      certificationDocuments,
      referees,
      acceptedTerms = false,
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
            profilePictureUrl,
            certificationDocuments,
            referees,
            acceptedTerms,
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
