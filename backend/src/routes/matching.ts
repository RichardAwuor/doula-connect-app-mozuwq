import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface MatchingParams {
  userId: string;
}

/**
 * Calculate distance between two points using Haversine formula (simplified)
 * For now, we assume if the doula's drive distance covers the difference between locations, it's a match
 */
function checkLocationMatch(parentState: string, parentTown: string, doulaState: string, doulaTown: string, driveDistance: number): boolean {
  // Simplified: only match if same state
  if (parentState.toLowerCase() !== doulaState.toLowerCase()) {
    return false;
  }
  // In production, calculate actual distance and compare with driveDistance
  return true;
}

/**
 * Check if arrays have overlapping values
 */
function hasOverlap(arr1: any[], arr2: any[]): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  return arr1.some(item => arr2.includes(item));
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Get matching doulas for a parent
   */
  fastify.get<{ Params: MatchingParams }>('/matching/doulas/:userId', {
    schema: {
      description: 'Get matching doulas for a parent user',
      tags: ['matching'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Matching doulas retrieved',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              state: { type: 'string' },
              rating: { type: 'string' },
              reviewCount: { type: 'number' },
              hourlyRateMin: { type: 'string' },
              hourlyRateMax: { type: 'string' },
              serviceCategories: { type: 'array' },
            },
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
  }, async (request: FastifyRequest<{ Params: MatchingParams }>, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params;

    try {
      // Get parent profile
      const parentProfiles = await app.db
        .select()
        .from(schema.parentProfiles)
        .where(eq(schema.parentProfiles.userId, userId));

      if (parentProfiles.length === 0) {
        await reply.status(404).send({ error: 'Parent profile not found' });
        return;
      }

      const parentProfile = parentProfiles[0];

      // Get all active doulas
      const doulas = await app.db
        .select()
        .from(schema.doulaProfiles)
        .where(eq(schema.doulaProfiles.subscriptionActive, true));

      // Filter and match doulas
      const matches = doulas.filter(doula => {
        // Location match
        if (!checkLocationMatch(
          parentProfile.state as string,
          parentProfile.town as string,
          doula.state,
          doula.town,
          doula.driveDistance
        )) {
          return false;
        }

        // Service categories overlap
        if (!hasOverlap(parentProfile.serviceCategories as any[], doula.serviceCategories as any[])) {
          return false;
        }

        // Payment preferences overlap
        if (!hasOverlap(parentProfile.financingType as any[], doula.paymentPreferences as any[])) {
          return false;
        }

        // Language preferences overlap (if parent has preferences)
        if (parentProfile.preferredLanguages && Array.isArray(parentProfile.preferredLanguages)) {
          if (!hasOverlap(parentProfile.preferredLanguages as any[], doula.spokenLanguages as any[])) {
            return false;
          }
        }

        return true;
      });

      // Return matches with selected fields
      const matchingDoulas = matches.map(doula => ({
        id: doula.id,
        userId: doula.userId,
        firstName: doula.firstName,
        lastName: doula.lastName,
        state: doula.state,
        town: doula.town,
        rating: doula.rating,
        reviewCount: doula.reviewCount,
        hourlyRateMin: doula.hourlyRateMin,
        hourlyRateMax: doula.hourlyRateMax,
        serviceCategories: doula.serviceCategories,
        spokenLanguages: doula.spokenLanguages,
        certifications: doula.certifications,
        profilePictureUrl: doula.profilePictureUrl,
      }));

      app.logger.info(`Retrieved ${matchingDoulas.length} matching doulas for parent ${userId}`);

      await reply.status(200).send(matchingDoulas);
    } catch (error) {
      app.logger.error(`Error retrieving matching doulas: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to retrieve matches' });
    }
  });

  /**
   * Get matching parents for a doula
   */
  fastify.get<{ Params: MatchingParams }>('/matching/parents/:userId', {
    schema: {
      description: 'Get matching parents for a doula user',
      tags: ['matching'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Matching parents retrieved',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              state: { type: 'string' },
              serviceCategories: { type: 'array' },
            },
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
  }, async (request: FastifyRequest<{ Params: MatchingParams }>, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params;

    try {
      // Get doula profile
      const doulaProfiles = await app.db
        .select()
        .from(schema.doulaProfiles)
        .where(eq(schema.doulaProfiles.userId, userId));

      if (doulaProfiles.length === 0) {
        await reply.status(404).send({ error: 'Doula profile not found' });
        return;
      }

      const doulaProfile = doulaProfiles[0];

      // Get all active parents
      const parents = await app.db
        .select()
        .from(schema.parentProfiles)
        .where(eq(schema.parentProfiles.subscriptionActive, true));

      // Filter and match parents
      const matches = parents.filter(parent => {
        // Location match
        if (!checkLocationMatch(
          parent.state,
          parent.town,
          doulaProfile.state,
          doulaProfile.town,
          doulaProfile.driveDistance
        )) {
          return false;
        }

        // Service categories overlap
        if (!hasOverlap(parent.serviceCategories as any[], doulaProfile.serviceCategories as any[])) {
          return false;
        }

        // Payment preferences overlap
        if (!hasOverlap(parent.financingType as any[], doulaProfile.paymentPreferences as any[])) {
          return false;
        }

        // Language overlap (if parent has preferences)
        if (parent.preferredLanguages && Array.isArray(parent.preferredLanguages)) {
          if (!hasOverlap(parent.preferredLanguages as any[], doulaProfile.spokenLanguages as any[])) {
            return false;
          }
        }

        return true;
      });

      // Return matches with selected fields
      const matchingParents = matches.map(parent => ({
        id: parent.id,
        userId: parent.userId,
        firstName: parent.firstName,
        lastName: parent.lastName,
        state: parent.state,
        town: parent.town,
        serviceCategories: parent.serviceCategories,
        financingType: parent.financingType,
      }));

      app.logger.info(`Retrieved ${matchingParents.length} matching parents for doula ${userId}`);

      await reply.status(200).send(matchingParents);
    } catch (error) {
      app.logger.error(`Error retrieving matching parents: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to retrieve matches' });
    }
  });
}
