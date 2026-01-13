import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface GetParentProfileParams {
  userId: string;
}

interface UpdateParentProfileRequest {
  firstName?: string;
  lastName?: string;
  state?: string;
  town?: string;
  zipCode?: string;
  serviceCategories?: string[];
  financingType?: string[];
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  preferredLanguages?: string[];
  desiredDays?: string[];
  desiredStartTime?: string;
  desiredEndTime?: string;
  acceptedTerms?: boolean;
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Get parent profile by user ID
   */
  fastify.get<{ Params: GetParentProfileParams }>('/parents/:userId', {
    schema: {
      description: 'Get parent profile by user ID',
      tags: ['parents'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User ID' },
        },
      },
      response: {
        200: {
          description: 'Parent profile retrieved',
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            state: { type: 'string' },
            town: { type: 'string' },
            zipCode: { type: 'string' },
            serviceCategories: { type: 'array' },
            financingType: { type: 'array' },
            acceptedTerms: { type: 'boolean' },
            subscriptionActive: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        404: {
          description: 'Parent profile not found',
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
  }, async (request: FastifyRequest<{ Params: GetParentProfileParams }>, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params;

    try {
      const profile = await app.db
        .select()
        .from(schema.parentProfiles)
        .where(eq(schema.parentProfiles.userId, userId));

      if (profile.length === 0) {
        await reply.status(404).send({ error: 'Parent profile not found' });
        return;
      }

      await reply.status(200).send(profile[0]);
    } catch (error) {
      app.logger.error(`Error fetching parent profile: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to fetch profile' });
    }
  });

  /**
   * Update parent profile
   */
  fastify.put<{ Params: GetParentProfileParams; Body: UpdateParentProfileRequest }>('/parents/:userId', {
    schema: {
      description: 'Update parent profile',
      tags: ['parents'],
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
          serviceCategories: { type: 'array', items: { type: 'string' } },
          financingType: { type: 'array', items: { type: 'string' } },
          servicePeriodStart: { type: 'string' },
          servicePeriodEnd: { type: 'string' },
          preferredLanguages: { type: 'array', items: { type: 'string' } },
          desiredDays: { type: 'array', items: { type: 'string' } },
          desiredStartTime: { type: 'string' },
          desiredEndTime: { type: 'string' },
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
          description: 'Parent profile not found',
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
    request: FastifyRequest<{ Params: GetParentProfileParams; Body: UpdateParentProfileRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { userId } = request.params;
    const updateData = request.body;

    try {
      // Check if profile exists
      const profile = await app.db
        .select()
        .from(schema.parentProfiles)
        .where(eq(schema.parentProfiles.userId, userId));

      if (profile.length === 0) {
        await reply.status(404).send({ error: 'Parent profile not found' });
        return;
      }

      // Build update object with only provided fields
      const updateObject: any = {};
      if (updateData.firstName !== undefined) updateObject.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) updateObject.lastName = updateData.lastName;
      if (updateData.state !== undefined) updateObject.state = updateData.state;
      if (updateData.town !== undefined) updateObject.town = updateData.town;
      if (updateData.zipCode !== undefined) updateObject.zipCode = updateData.zipCode;
      if (updateData.serviceCategories !== undefined) updateObject.serviceCategories = updateData.serviceCategories;
      if (updateData.financingType !== undefined) updateObject.financingType = updateData.financingType;
      if (updateData.servicePeriodStart !== undefined) updateObject.servicePeriodStart = new Date(updateData.servicePeriodStart);
      if (updateData.servicePeriodEnd !== undefined) updateObject.servicePeriodEnd = new Date(updateData.servicePeriodEnd);
      if (updateData.preferredLanguages !== undefined) updateObject.preferredLanguages = updateData.preferredLanguages;
      if (updateData.desiredDays !== undefined) updateObject.desiredDays = updateData.desiredDays;
      if (updateData.desiredStartTime !== undefined) updateObject.desiredStartTime = new Date(updateData.desiredStartTime);
      if (updateData.desiredEndTime !== undefined) updateObject.desiredEndTime = new Date(updateData.desiredEndTime);
      if (updateData.acceptedTerms !== undefined) updateObject.acceptedTerms = updateData.acceptedTerms;

      await app.db
        .update(schema.parentProfiles)
        .set(updateObject)
        .where(eq(schema.parentProfiles.userId, userId));

      app.logger.info(`Parent profile updated: ${userId}`);

      await reply.status(200).send({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      app.logger.error(`Error updating parent profile: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to update profile' });
    }
  });
}
