import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface GetDoulaProfileParams {
  userId: string;
}

interface UpdateDoulaProfileRequest {
  firstName?: string;
  lastName?: string;
  state?: string;
  town?: string;
  zipCode?: string;
  paymentPreferences?: string[];
  driveDistance?: number;
  spokenLanguages?: string[];
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  serviceCategories?: string[];
  certifications?: string[];
  profilePictureUrl?: string;
  certificationDocuments?: any[];
  referees?: any[];
  acceptedTerms?: boolean;
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Get doula profile by user ID
   */
  fastify.get<{ Params: GetDoulaProfileParams }>('/doulas/:userId', {
    schema: {
      description: 'Get doula profile by user ID',
      tags: ['doulas'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' },
        },
      },
      response: {
        200: {
          description: 'Doula profile retrieved',
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            state: { type: 'string' },
            town: { type: 'string' },
            zipCode: { type: 'string' },
            paymentPreferences: { type: 'array' },
            driveDistance: { type: 'number' },
            spokenLanguages: { type: 'array' },
            hourlyRateMin: { type: 'string' },
            hourlyRateMax: { type: 'string' },
            serviceCategories: { type: 'array' },
            certifications: { type: 'array' },
            rating: { type: 'string' },
            reviewCount: { type: 'number' },
            acceptedTerms: { type: 'boolean' },
            subscriptionActive: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        404: {
          description: 'Doula profile not found',
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
  }, async (request: FastifyRequest<{ Params: GetDoulaProfileParams }>, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params;

    try {
      const profile = await app.db
        .select()
        .from(schema.doulaProfiles)
        .where(eq(schema.doulaProfiles.userId, userId));

      if (profile.length === 0) {
        await reply.status(404).send({ error: 'Doula profile not found' });
        return;
      }

      await reply.status(200).send(profile[0]);
    } catch (error) {
      app.logger.error(`Error fetching doula profile: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to fetch profile' });
    }
  });

  /**
   * Update doula profile
   */
  fastify.put<{ Params: GetDoulaProfileParams; Body: UpdateDoulaProfileRequest }>('/doulas/:userId', {
    schema: {
      description: 'Update doula profile',
      tags: ['doulas'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
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
          certificationDocuments: { type: 'array' },
          referees: { type: 'array' },
          acceptedTerms: { type: 'boolean' },
        },
      },
      response: {
        200: {
          description: 'Profile updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: {
          description: 'Doula profile not found',
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
    request: FastifyRequest<{ Params: GetDoulaProfileParams; Body: UpdateDoulaProfileRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId } = request.params;
    const updateData = request.body;

    try {
      // Check if profile exists
      const profile = await app.db
        .select()
        .from(schema.doulaProfiles)
        .where(eq(schema.doulaProfiles.userId, userId));

      if (profile.length === 0) {
        await reply.status(404).send({ error: 'Doula profile not found' });
        return;
      }

      // Build update object with only provided fields
      const updateObject: any = {};
      if (updateData.firstName !== undefined) updateObject.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) updateObject.lastName = updateData.lastName;
      if (updateData.state !== undefined) updateObject.state = updateData.state;
      if (updateData.town !== undefined) updateObject.town = updateData.town;
      if (updateData.zipCode !== undefined) updateObject.zipCode = updateData.zipCode;
      if (updateData.paymentPreferences !== undefined) updateObject.paymentPreferences = updateData.paymentPreferences;
      if (updateData.driveDistance !== undefined) updateObject.driveDistance = updateData.driveDistance;
      if (updateData.spokenLanguages !== undefined) updateObject.spokenLanguages = updateData.spokenLanguages;
      if (updateData.hourlyRateMin !== undefined) updateObject.hourlyRateMin = updateData.hourlyRateMin.toString();
      if (updateData.hourlyRateMax !== undefined) updateObject.hourlyRateMax = updateData.hourlyRateMax.toString();
      if (updateData.serviceCategories !== undefined) updateObject.serviceCategories = updateData.serviceCategories;
      if (updateData.certifications !== undefined) updateObject.certifications = updateData.certifications;
      if (updateData.profilePictureUrl !== undefined) updateObject.profilePictureUrl = updateData.profilePictureUrl;
      if (updateData.certificationDocuments !== undefined) updateObject.certificationDocuments = updateData.certificationDocuments;
      if (updateData.referees !== undefined) updateObject.referees = updateData.referees;
      if (updateData.acceptedTerms !== undefined) updateObject.acceptedTerms = updateData.acceptedTerms;

      await app.db
        .update(schema.doulaProfiles)
        .set(updateObject)
        .where(eq(schema.doulaProfiles.userId, userId));

      app.logger.info(`Doula profile updated: ${userId}`);

      await reply.status(200).send({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      app.logger.error(`Error updating doula profile: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to update profile' });
    }
  });
}
