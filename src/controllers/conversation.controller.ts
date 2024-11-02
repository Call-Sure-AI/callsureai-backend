import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { Prisma } from '@prisma/client';

export class ConversationController {
    private validateConversationData(data: any): boolean {
        return (
            data.customerPk &&
            typeof data.customerPk === 'string' &&
            data.agentPk &&
            typeof data.agentPk === 'string' &&
            data.timeDate &&
            !isNaN(new Date(data.timeDate).getTime()) &&
            data.duration &&
            typeof data.duration === 'number' &&
            data.duration > 0 &&
            data.exchange &&
            typeof data.exchange === 'string' &&
            data.exchange.trim().length > 0
        );
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { customerPk, agentPk, timeDate, duration, exchange, transcript, file } = req.body;

            if (!this.validateConversationData({ customerPk, agentPk, timeDate, duration, exchange })) {
                throw new AppError('Invalid conversation data', 400);
            }

            const prisma = await PrismaService.getInstance();

            const conversation = await prisma.conversation.create({
                data: {
                    timeDate: new Date(timeDate),
                    duration,
                    exchange,
                    transcript,
                    file,
                    customer: {
                        connect: { pk: customerPk }
                    },
                    agent: {
                        connect: { pk: agentPk }
                    }
                },
                include: {
                    customer: {
                        select: {
                            pk: true,
                            name: true
                        }
                    },
                    agent: {
                        select: {
                            pk: true,
                            name: true,
                            spec: true
                        }
                    }
                }
            });

            res.status(201).json(conversation);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                next(new AppError('Customer or Agent not found', 404));
            } else {
                next(error);
            }
        }
    }

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                customerPk,
                agentPk,
                startDate,
                endDate,
                page = '1',
                limit = '10',
                sortBy = 'timeDate',
                sortOrder = 'desc'
            } = req.query;

            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            const take = parseInt(limit as string);

            let whereClause: Prisma.ConversationWhereInput = {};

            if (startDate && endDate) {
                whereClause.timeDate = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                };
            }

            if (customerPk) {
                whereClause.customerPk = customerPk as string;
            }

            if (agentPk) {
                whereClause.agentPk = agentPk as string;
            }

            const prisma = await PrismaService.getInstance();

            const [conversations, total] = await Promise.all([
                prisma.conversation.findMany({
                    where: whereClause,
                    include: {
                        customer: {
                            select: {
                                pk: true,
                                name: true
                            }
                        },
                        agent: {
                            select: {
                                pk: true,
                                name: true,
                                spec: true
                            }
                        }
                    },
                    orderBy: {
                        [sortBy as string]: sortOrder
                    },
                    skip,
                    take
                }),
                prisma.conversation.count({ where: whereClause })
            ]);

            res.json({
                data: conversations,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: take,
                    pages: Math.ceil(total / take)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    getByPk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pk } = req.params;
            const prisma = await PrismaService.getInstance();

            const conversation = await prisma.conversation.findUnique({
                where: { pk },
                include: {
                    customer: true,
                    agent: true
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

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pk } = req.params;
            const { timeDate, duration, exchange, transcript, file } = req.body;

            const MAX_RETRIES = 3;
            let retries = 0;
            let conversation = null;

            const prisma = await PrismaService.getInstance();

            while (retries < MAX_RETRIES) {
                try {
                    conversation = await prisma.$transaction(async (tx) => {
                        const current = await tx.conversation.findUnique({
                            where: { pk },
                            select: { version: true }
                        });

                        if (!current) {
                            throw new AppError('Conversation not found', 404);
                        }

                        return await tx.conversation.update({
                            where: {
                                pk,
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
                                customer: {
                                    select: {
                                        pk: true,
                                        name: true
                                    }
                                },
                                agent: {
                                    select: {
                                        pk: true,
                                        name: true,
                                        spec: true
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

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pk } = req.params;
            const prisma = await PrismaService.getInstance();

            const conversation = await prisma.conversation.findUnique({
                where: { pk },
                select: { pk: true }
            });

            if (!conversation) {
                throw new AppError('Conversation not found', 404);
            }

            await prisma.conversation.delete({
                where: { pk }
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    getByCustomerPk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { customerPk } = req.params;
            const { page = '1', limit = '10' } = req.query;

            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            const take = parseInt(limit as string);

            const prisma = await PrismaService.getInstance();

            const [conversations, total] = await Promise.all([
                prisma.conversation.findMany({
                    where: {
                        pk: customerPk
                    },
                    include: {
                        agent: {
                            select: {
                                pk: true,
                                name: true,
                                spec: true
                            }
                        }
                    },
                    orderBy: {
                        timeDate: 'desc'
                    },
                    skip,
                    take
                }),
                prisma.conversation.count({
                    where: { pk: customerPk }
                })
            ]);

            res.json({
                data: conversations,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: take,
                    pages: Math.ceil(total / take)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    getByAgentPk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { agentPk } = req.params;
            const { page = '1', limit = '10' } = req.query;

            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            const take = parseInt(limit as string);

            const prisma = await PrismaService.getInstance();

            const [conversations, total] = await Promise.all([
                prisma.conversation.findMany({
                    where: {
                        pk: agentPk
                    },
                    include: {
                        customer: {
                            select: {
                                pk: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        timeDate: 'desc'
                    },
                    skip,
                    take
                }),
                prisma.conversation.count({
                    where: { pk: agentPk }
                })
            ]);

            res.json({
                data: conversations,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: take,
                    pages: Math.ceil(total / take)
                }
            });
        } catch (error) {
            next(error);
        }
    }
}