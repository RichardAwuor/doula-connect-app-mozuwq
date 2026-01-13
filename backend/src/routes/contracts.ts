import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateContractRequest {
  parentId: string;
  doulaId: string;
  startDate: string;
}

interface UpdateContractRequest {
  status?: 'active' | 'completed' | 'cancelled';
  endDate?: string;
}

interface GetContractParams {
  contractId: string;
}

interface GetUserContractsParams {
  userId: string;
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Create a new contract between parent and doula
   */
  fastify.post('/contracts', {
    schema: {
      description: 'Create a new contract between parent and doula',
      tags: ['contracts'],
      body: {
        type: 'object',
        required: ['parentId', 'doulaId', 'startDate'],
        properties: {
          parentId: { type: 'string' },
          doulaId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: {
          description: 'Contract created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            contractId: { type: 'string' },
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
    request: FastifyRequest<{ Body: CreateContractRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { parentId, doulaId, startDate } = request.body;

    if (!parentId || !doulaId || !startDate) {
      await reply.status(400).send({ error: 'Missing required fields' });
      return;
    }

    try {
      const [contract] = await app.db
        .insert(schema.contracts)
        .values({
          parentId,
          doulaId,
          startDate: new Date(startDate),
          status: 'active',
        })
        .returning();

      app.logger.info(`Contract created: ${contract.id}`);

      await reply.status(201).send({
        success: true,
        message: 'Contract created successfully',
        contractId: contract.id,
      });
    } catch (error) {
      app.logger.error(`Error creating contract: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to create contract' });
    }
  });

  /**
   * Get contract details by ID
   */
  fastify.get<{ Params: GetContractParams }>('/contracts/:contractId', {
    schema: {
      description: 'Get contract details by ID',
      tags: ['contracts'],
      params: {
        type: 'object',
        required: ['contractId'],
        properties: {
          contractId: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Contract retrieved',
          type: 'object',
          properties: {
            id: { type: 'string' },
            parentId: { type: 'string' },
            doulaId: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        404: {
          description: 'Contract not found',
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
  }, async (request: FastifyRequest<{ Params: GetContractParams }>, reply: FastifyReply): Promise<void> => {
    const { contractId } = request.params;

    try {
      const contracts = await app.db
        .select()
        .from(schema.contracts)
        .where(eq(schema.contracts.id, contractId));

      if (contracts.length === 0) {
        await reply.status(404).send({ error: 'Contract not found' });
        return;
      }

      await reply.status(200).send(contracts[0]);
    } catch (error) {
      app.logger.error(`Error fetching contract: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to fetch contract' });
    }
  });

  /**
   * Get contracts for a user (both parent and doula roles)
   */
  fastify.get<{ Params: GetUserContractsParams }>('/users/:userId/contracts', {
    schema: {
      description: 'Get contracts for a user (as parent or doula)',
      tags: ['contracts'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Contracts retrieved',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              parentId: { type: 'string' },
              doulaId: { type: 'string' },
              startDate: { type: 'string' },
              status: { type: 'string' },
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
  }, async (request: FastifyRequest<{ Params: GetUserContractsParams }>, reply: FastifyReply): Promise<void> => {
    const { userId } = request.params;

    try {
      const contracts = await app.db
        .select()
        .from(schema.contracts)
        .where(
          and(
            // Placeholder for OR condition - Drizzle doesn't have direct OR
            // We'll fetch both and combine
          )
        );

      // Since Drizzle doesn't have direct OR, we query separately
      const parentContracts = await app.db
        .select()
        .from(schema.contracts)
        .where(eq(schema.contracts.parentId, userId));

      const doulaContracts = await app.db
        .select()
        .from(schema.contracts)
        .where(eq(schema.contracts.doulaId, userId));

      const allContracts = [...parentContracts, ...doulaContracts];

      app.logger.info(`Retrieved ${allContracts.length} contracts for user ${userId}`);

      await reply.status(200).send(allContracts);
    } catch (error) {
      app.logger.error(`Error fetching user contracts: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to fetch contracts' });
    }
  });

  /**
   * Update contract status and end date
   */
  fastify.put<{ Params: GetContractParams; Body: UpdateContractRequest }>('/contracts/:contractId', {
    schema: {
      description: 'Update contract status and end date',
      tags: ['contracts'],
      params: {
        type: 'object',
        required: ['contractId'],
        properties: {
          contractId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'completed', 'cancelled'] },
          endDate: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        200: {
          description: 'Contract updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: {
          description: 'Contract not found',
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
    request: FastifyRequest<{ Params: GetContractParams; Body: UpdateContractRequest }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { contractId } = request.params;
    const { status, endDate } = request.body;

    try {
      // Check if contract exists
      const contracts = await app.db
        .select()
        .from(schema.contracts)
        .where(eq(schema.contracts.id, contractId));

      if (contracts.length === 0) {
        await reply.status(404).send({ error: 'Contract not found' });
        return;
      }

      const updateObject: any = {};
      if (status !== undefined) updateObject.status = status;
      if (endDate !== undefined) updateObject.endDate = new Date(endDate);

      await app.db
        .update(schema.contracts)
        .set(updateObject)
        .where(eq(schema.contracts.id, contractId));

      app.logger.info(`Contract updated: ${contractId}`);

      await reply.status(200).send({
        success: true,
        message: 'Contract updated successfully',
      });
    } catch (error) {
      app.logger.error(`Error updating contract: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({ error: 'Failed to update contract' });
    }
  });
}
