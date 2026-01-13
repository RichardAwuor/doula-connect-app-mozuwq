import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateCommentRequest {
  contractId: string;
  parentId: string;
  doulaId: string;
  parentName: string;
  comment: string;
}

interface GetDoulaCommentsParams {
  doulaId: string;
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Create a comment/review from parent on a completed contract
   */
  fastify.post('/comments', {
    schema: {
      description: 'Create a comment/review on a completed contract',
      tags: ['comments'],
      body: {
        type: 'object',
        required: ['contractId', 'parentId', 'doulaId', 'parentName', 'comment'],
        properties: {
          contractId: { type: 'string' },
          parentId: { type: 'string' },
          doulaId: { type: 'string' },
          parentName: { type: 'string' },
          comment: { type: 'string', maxLength: 160 },
        },
      },
      response: {
        201: {
          description: 'Comment created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            commentId: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid request',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        409: {
          description: 'Comment already exists for this contract',
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
    request: FastifyRequest<{ Body: CreateCommentRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { contractId, parentId, doulaId, parentName, comment } = request.body;

    // Validate input
    if (!contractId || !parentId || !doulaId || !parentName || !comment) {
      await reply.status(400).send({ error: 'Missing required fields' });
      return;
    }

    if (comment.length > 160) {
      await reply.status(400).send({ error: 'Comment must be 160 characters or less' });
      return;
    }

    try {
      // Check if contract exists
      const contracts = await app.db
        .select()
        .from(schema.contracts)
        .where(eq(schema.contracts.id, contractId));

      if (contracts.length === 0) {
        await reply.status(400).send({ error: 'Contract not found' });
        return;
      }

      // Check if contract is completed
      if (contracts[0].status !== 'completed') {
        await reply.status(400).send({ error: 'Comments can only be added to completed contracts' });
        return;
      }

      // Check if comment already exists for this contract-parent combination
      const existingComments = await app.db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.contractId, contractId));

      // Check for duplicate review from same parent
      if (existingComments.some(c => c.parentId === parentId)) {
        await reply.status(409).send({ error: 'You have already reviewed this contract' });
        return;
      }

      // Create comment in transaction to update doula rating
      const result = await app.db.transaction(async (tx) => {
        // Insert comment
        const [newComment] = await tx
          .insert(schema.comments)
          .values({
            contractId,
            parentId,
            doulaId,
            parentName,
            comment,
          })
          .returning();

        // Get all comments for this doula
        const doulaComments = await tx
          .select()
          .from(schema.comments)
          .where(eq(schema.comments.doulaId, doulaId));

        // Calculate new rating (for now, we'll track it, rating calculation would be done by business logic)
        const newReviewCount = doulaComments.length;

        // Update doula profile with new review count
        await tx
          .update(schema.doulaProfiles)
          .set({
            reviewCount: newReviewCount,
          })
          .where(eq(schema.doulaProfiles.userId, doulaId));

        return newComment;
      });

      app.logger.info(`Comment created: ${result.id} on contract ${contractId}`);

      await reply.status(201).send({
        success: true,
        message: 'Comment created successfully',
        commentId: result.id,
      });
    } catch (error) {
      app.logger.error(`Error creating comment: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to create comment' });
    }
  });

  /**
   * Get all comments for a doula (reviews)
   */
  fastify.get<{ Params: GetDoulaCommentsParams }>('/doulas/:doulaId/comments', {
    schema: {
      description: 'Get all comments/reviews for a doula',
      tags: ['comments'],
      params: {
        type: 'object',
        required: ['doulaId'],
        properties: {
          doulaId: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Comments retrieved',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              contractId: { type: 'string' },
              parentName: { type: 'string' },
              comment: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: GetDoulaCommentsParams }>, reply: FastifyReply): Promise<void> => {
    const { doulaId } = request.params;

    try {
      const comments = await app.db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.doulaId, doulaId));

      // Sort by most recent first
      const sortedComments = comments.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      app.logger.info(`Retrieved ${sortedComments.length} comments for doula ${doulaId}`);

      await reply.status(200).send(sortedComments);
    } catch (error) {
      app.logger.error(`Error fetching doula comments: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to fetch comments' });
    }
  });
}
