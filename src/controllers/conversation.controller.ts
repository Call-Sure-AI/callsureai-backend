import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { Prisma } from '@prisma/client';

export class ConversationController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { custAgentId, timeDate, duration, exchange, transcript, file } = req.body;

            const prisma = await PrismaService.getInstance();

            const custAgent = await prisma.cust_Agent.findUnique({
                where: { id: custAgentId }
            });

            if (!custAgent) {
                throw new AppError('Customer-Agent relationship not found', 404);
            }

            const conversation = await prisma.conversation.create({
                data: {
                    timeDate: new Date(timeDate),
                    duration,
                    exchange,
                    transcript,
                    file,
                    custAgentId
                },
                include: {
                    custAgent: {
                        include: {
                            customer: true,
                            agent: true
                        }
                    }
                }
            });

            res.status(201).json(conversation);
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { customerId, agentId, startDate, endDate } = req.query;

            let whereClause: any = {};

            if (startDate && endDate) {
                whereClause.timeDate = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                };
            }

            if (customerId || agentId) {
                whereClause.custAgent = {};
                if (customerId) {
                    whereClause.custAgent.customerID = customerId;
                }
                if (agentId) {
                    whereClause.custAgent.agentID = agentId;
                }
            }

            const prisma = await PrismaService.getInstance();

            const conversations = await prisma.conversation.findMany({
                where: whereClause,
                include: {
                    custAgent: {
                        include: {
                            customer: true,
                            agent: true
                        }
                    }
                },
                orderBy: {
                    timeDate: 'desc'
                }
            });

            res.json(conversations);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const prisma = await PrismaService.getInstance();

            const conversation = await prisma.conversation.findUnique({
                where: { id },
                include: {
                    custAgent: {
                        include: {
                            customer: true,
                            agent: true
                        }
                    }
                }
            });

            if (!conversation) {
                throw new AppError('Conversation not found', 404);
            }

            res.json(conversation);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { timeDate, duration, exchange, transcript, file } = req.body;

            const MAX_RETRIES = 3;
            let retries = 0;
            let conversation = null;

            const prisma = await PrismaService.getInstance();

            while (retries < MAX_RETRIES) {
                try {
                    conversation = await prisma.$transaction(async (tx) => {
                        const current = await tx.conversation.findUnique({
                            where: { id },
                            select: { version: true }
                        });

                        if (!current) {
                            throw new AppError('Conversation not found', 404);
                        }

                        return await tx.conversation.update({
                            where: {
                                id,
                                version: current.version
                            },
                            data: {
                                ...(timeDate && { timeDate: new Date(timeDate) }),
                                ...(duration && { duration }),
                                ...(exchange && { exchange }),
                                ...(transcript && { transcript }),
                                ...(file && { file }),
                                version: { increment: 1 }
                            },
                            include: {
                                custAgent: {
                                    include: {
                                        customer: true,
                                        agent: true
                                    }
                                }
                            }
                        });
                    });

                    break;
                } catch (error) {
                    if (error instanceof Prisma.PrismaClientKnownRequestError) {
                        if (error.code === 'P2002' || error.code === 'P2034') {
                            retries++;
                            if (retries === MAX_RETRIES) {
                                throw new AppError('Failed to update due to concurrent modifications', 409);
                            }
                            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
                            continue;
                        }
                    }
                    throw error;
                }
            }

            res.json(conversation);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const prisma = await PrismaService.getInstance();

            await prisma.conversation.delete({
                where: { id }
            });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getConversationsByCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const { customerId } = req.params;

            const prisma = await PrismaService.getInstance();

            const conversations = await prisma.conversation.findMany({
                where: {
                    custAgent: {
                        customerID: customerId
                    }
                },
                include: {
                    custAgent: {
                        include: {
                            agent: true
                        }
                    }
                },
                orderBy: {
                    timeDate: 'desc'
                }
            });

            res.json(conversations);
        } catch (error) {
            next(error);
        }
    }

    async getConversationsByAgent(req: Request, res: Response, next: NextFunction) {
        try {
            const { agentId } = req.params;

            const prisma = await PrismaService.getInstance();

            const conversations = await prisma.conversation.findMany({
                where: {
                    custAgent: {
                        agentID: agentId
                    }
                },
                include: {
                    custAgent: {
                        include: {
                            customer: true
                        }
                    }
                },
                orderBy: {
                    timeDate: 'desc'
                }
            });

            res.json(conversations);
        } catch (error) {
            next(error);
        }
    }
}