import { Request, Response } from 'express';
import { PrismaService } from '../lib/prisma';
import { ZodError } from 'zod';
import { createAgentSchema, updateAgentSchema } from '../middleware/validators/agent-validator';
import { ActivityLogger } from '../utils/activity-logger';

export class AgentController {
    // Get all agents
    static async getAll(req: Request, res: Response) {
        try {
            const agentId = req.query.id as string;

            if (agentId) {
                return AgentController.getById(req, res, agentId);
            }

            const { id } = req.user;
            const prisma = await PrismaService.getInstance();
            const agents = await prisma.agent.findMany({
                where: { user_id: id },
                include: {
                    companies: true,
                    conversations: true
                }
            });
            return res.status(200).json(agents);
        } catch (error) {
            console.error('Error fetching agents:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get single agent by ID
    static async getById(req: Request, res: Response, id: string) {
        try {
            const prisma = await PrismaService.getInstance();
            const agent = await prisma.agent.findUnique({
                where: { id },
                include: {
                    companies: true,
                    conversations: true
                }
            });

            if (!agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }

            return res.status(200).json(agent);
        } catch (error) {
            console.error('Error fetching agent:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get agents by user_id
    static async getByUserId(req: Request, res: Response) {
        try {
            const { id: user_id } = req.user;
            const prisma = await PrismaService.getInstance();
            const agents = await prisma.agent.findMany({
                where: { user_id },
                include: {
                    companies: true,
                    conversations: true
                }
            });
            return res.status(200).json(agents);
        } catch (error) {
            console.error('Error fetching agents:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Create new agent
    static async create(req: Request, res: Response) {
        try {
            const validatedData = createAgentSchema.parse(req.body);
            const prisma = await PrismaService.getInstance();
    
            // Don't manually set created_at and updated_at
            // Prisma will handle these automatically
            const agent = await prisma.agent.create({
                data: validatedData
            });
    
            try {
                await ActivityLogger.log({
                    user_id: validatedData.user_id,
                    action: 'CREATE',
                    entity_type: 'AGENT',
                    entity_id: agent.id,
                    metadata: {
                        name: agent.name,
                        type: agent.type,
                        company_id: agent.company_id
                    }
                });
            } catch (error) {
                console.error('Failed to log agent creation activity:', error);
            }
    
            return res.status(201).json(agent);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({ error: error.issues });
            }
            console.error('Error creating agent:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Update agent
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const validatedData = updateAgentSchema.parse(req.body);
            const prisma = await PrismaService.getInstance();
    
            const checkAgent = await prisma.agent.findUnique({
                where: { id },
            });
    
            if (!checkAgent) {
                return res.status(404).json({ error: 'Agent not found' });
            }
    
            // Don't spread the entire checkAgent object
            // Only use the validated data for the update
            const agent = await prisma.agent.update({
                where: { id },
                data: validatedData // Prisma will handle updated_at automatically
            });
    
            try {
                await ActivityLogger.log({
                    user_id: req.user.id,
                    action: 'UPDATE',
                    entity_type: 'AGENT',
                    entity_id: agent.id,
                    metadata: {
                        updated_fields: validatedData
                    }
                });
            } catch (error) {
                console.error('Failed to log agent update activity:', error);
            }
    
            return res.status(200).json(agent);
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(400).json({ error: error.issues });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Agent not found' });
            }
            console.error('Error updating agent:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Delete agent
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const prisma = await PrismaService.getInstance();

            const checkAgent = await prisma.agent.delete({
                where: { id }
            });

            try {
                await ActivityLogger.log({
                    user_id: req.user.id,
                    action: 'DELETE',
                    entity_type: 'AGENT',
                    entity_id: id,
                    metadata: {
                        agent_name: checkAgent.name
                    }
                });
            } catch (error) {
                console.error('Failed to log agent deletion activity:', error);
            }

            return res.status(204).json(checkAgent);
        } catch (error: any) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Agent not found' });
            }
            console.error('Error deleting agent:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
