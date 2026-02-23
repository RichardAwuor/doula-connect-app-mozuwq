import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface DeleteAccountParams {
  userId: string;
}

interface DeleteAccountResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Delete user account and all related data
   */
  fastify.delete<{ Params: DeleteAccountParams }>(
    '/api/delete-account/:userId',
    {
      schema: {
        description: 'Delete user account and all associated data',
        tags: ['account'],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid', description: 'User ID to delete' },
          },
        },
        response: {
          200: {
            description: 'Account deleted successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
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
            description: 'User not found',
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
    },
    async (
      request: FastifyRequest<{ Params: DeleteAccountParams }>,
      reply: FastifyReply
    ): Promise<DeleteAccountResponse> => {
      const { userId } = request.params;
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return { success: false, error: 'Unauthorized' };

      app.logger.info({ userId }, 'Starting account deletion process');

      try {
        // Verify user exists
        const user = await app.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, userId));

        if (user.length === 0) {
          app.logger.warn({ userId }, 'User not found for deletion');
          return await reply.status(404).send({
            success: false,
            error: 'User not found',
          });
        }

        const userRecord = user[0];
        app.logger.info({ userId, userType: userRecord.userType }, 'User found, proceeding with deletion');

        // Start transaction-like deletion process
        // Delete all contracts where user is either parent or doula
        await app.db
          .delete(schema.contracts)
          .where(
            or(
              eq(schema.contracts.parentId, userId),
              eq(schema.contracts.doulaId, userId)
            )
          );

        app.logger.info({ userId }, 'Contracts deleted');

        // Delete all comments related to this user (where they are parent or doula)
        await app.db
          .delete(schema.comments)
          .where(
            or(
              eq(schema.comments.parentId, userId),
              eq(schema.comments.doulaId, userId)
            )
          );

        app.logger.info({ userId }, 'Comments deleted');

        // Delete subscription records
        await app.db
          .delete(schema.subscriptions)
          .where(eq(schema.subscriptions.userId, userId));

        app.logger.info({ userId }, 'Subscriptions deleted');

        // Delete the user's profile (parent or doula)
        if (userRecord.userType === 'parent') {
          await app.db
            .delete(schema.parentProfiles)
            .where(eq(schema.parentProfiles.userId, userId));

          app.logger.info({ userId }, 'Parent profile deleted');
        } else if (userRecord.userType === 'doula') {
          await app.db
            .delete(schema.doulaProfiles)
            .where(eq(schema.doulaProfiles.userId, userId));

          app.logger.info({ userId }, 'Doula profile deleted');
        }

        // Delete the user record (this will cascade delete any remaining related records due to FK constraints)
        await app.db
          .delete(schema.users)
          .where(eq(schema.users.id, userId));

        app.logger.info({ userId }, 'User account deleted successfully');

        return await reply.status(200).send({
          success: true,
          message: 'Account deleted successfully',
        });
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to delete user account'
        );

        return await reply.status(500).send({
          success: false,
          error: 'Failed to delete account. Please try again later.',
        });
      }
    }
  );
}
