import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../lib/prisma';
import { AppError } from '../utils/app-error';

export class AgentController {
    private validateAgentData(data: any): boolean {
        return (
            data.name &&
            typeof data.name === 'string' &&
            data.name.trim().length > 0 &&
            data.spec &&
            typeof data.spec === 'string' &&
            data.spec.trim().length > 0 &&
            data.description &&
            typeof data.description === 'string' &&
            data.description.trim().length > 0
        );
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, spec, description } = req.body;

            if (!this.validateAgentData({ name, spec, description })) {
                throw new AppError('Invalid agent data', 400);
            }

            const prisma = await PrismaService.getInstance();

            const agent = await prisma.agent.create({
                data: { name, spec, description },
                include: {
                    customers: true,
                    conversations: true
                }
            });

            res.status(201).json(agent);
        } catch (error) {
            next(error);
        }
    }

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const prisma = await PrismaService.getInstance();
            const { page = '1', limit = '10' } = req.query;

            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            const take = parseInt(limit as string);

            const [agents, total] = await Promise.all([
                prisma.agent.findMany({
                    skip,
                    take,
                    include: {
                        customers: {
                            select: {
                                id: true,
                                name: true,
                                description: true
                            }
                        },
                        conversations: {
                            select: {
                                id: true,
                                timeDate: true,
                                duration: true,
                                exchange: true
                            },
                            orderBy: {
                                timeDate: 'desc'
                            },
                            take: 5
                        }
                    },
                    orderBy: {
                        name: 'asc'
                    }
                }),
                prisma.agent.count()
            ]);

            res.json({
                data: agents,
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

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const prisma = await PrismaService.getInstance();

            const agent = await prisma.agent.findUnique({
                where: { id },
                include: {
                    customers: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    },
                    conversations: {
                        select: {
                            id: true,
                            timeDate: true,
                            duration: true,
                            exchange: true,
                            transcript: true,
                            file: true,
                            version: true
                        },
                        orderBy: {
                            timeDate: 'desc'
                        }
                    }
                }
            });

            if (!agent) {
                throw new AppError('Agent not found', 404);
            }

            res.json(agent);
        } catch (error) {
            next(error);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { name, spec, description } = req.body;

            if (!this.validateAgentData({ name, spec, description })) {
                throw new AppError('Invalid agent data', 400);
            }

            const prisma = await PrismaService.getInstance();

            const agent = await prisma.agent.update({
                where: { id },
                data: { name, spec, description },
                include: {
                    customers: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            res.json(agent);
        } catch (error) {
            next(error);
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const prisma = await PrismaService.getInstance();

            // Check if agent exists and has no active conversations
            const agentWithConversations = await prisma.agent.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { conversations: true }
                    }
                }
            });

            if (!agentWithConversations) {
                throw new AppError('Agent not found', 404);
            }

            if (agentWithConversations._count.conversations > 0) {
                throw new AppError('Cannot delete agent with existing conversations', 400);
            }

            await prisma.agent.delete({
                where: { id }
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    getPerformanceMetrics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const timeframe = (req.query.timeframe as string) || '30d';

            const prisma = await PrismaService.getInstance();

            // Calculate date range
            const now = new Date();
            const startDate = new Date();
            switch (timeframe) {
                case '7d': startDate.setDate(now.getDate() - 7); break;
                case '30d': startDate.setDate(now.getDate() - 30); break;
                case '90d': startDate.setDate(now.getDate() - 90); break;
                case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
                default:
                    throw new AppError('Invalid timeframe. Supported values: 7d, 30d, 90d, 1y', 400);
            }

            // Get agent data with conversations in a single query
            const agentData = await prisma.agent.findUnique({
                where: { id },
                include: {
                    conversations: {
                        where: {
                            timeDate: {
                                gte: startDate,
                                lte: now
                            }
                        },
                        include: {
                            customer: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        },
                        orderBy: {
                            timeDate: 'asc'
                        }
                    },
                    customers: {
                        select: {
                            id: true
                        }
                    },
                    _count: {
                        select: {
                            customers: true,
                            conversations: true
                        }
                    }
                }
            });

            if (!agentData) {
                throw new AppError('Agent not found', 404);
            }

            // Process conversations and calculate metrics
            const conversationStats = agentData.conversations.reduce((stats, conv) => {
                // Update basic counts
                stats.totalConversations++;
                stats.totalDuration += conv.duration;
                if (conv.transcript) stats.withTranscript++;
                if (conv.file) stats.withFiles++;

                // Update daily metrics
                const dateKey = conv.timeDate.toISOString().split('T')[0];
                const dailyData = stats.dailyMetrics.get(dateKey) || {
                    count: 0,
                    duration: 0
                };
                dailyData.count++;
                dailyData.duration += conv.duration;
                stats.dailyMetrics.set(dateKey, dailyData);

                // Update customer interactions
                const customerData = stats.customerInteractions.get(conv.customer.id) || {
                    name: conv.customer.name,
                    count: 0,
                    duration: 0
                };
                customerData.count++;
                customerData.duration += conv.duration;
                stats.customerInteractions.set(conv.customer.id, customerData);

                return stats;
            }, {
                totalConversations: 0,
                totalDuration: 0,
                withTranscript: 0,
                withFiles: 0,
                dailyMetrics: new Map<string, { count: number; duration: number }>(),
                customerInteractions: new Map<string, { name: string; count: number; duration: number }>()
            });

            const metrics = {
                timeframe,
                agentInfo: {
                    id: agentData.id,
                    name: agentData.name,
                    spec: agentData.spec,
                    description: agentData.description,
                    generate: agentData.generate
                },
                overview: {
                    totalConversations: conversationStats.totalConversations,
                    totalCustomers: agentData._count.customers,
                    avgConversationDuration: conversationStats.totalConversations > 0
                        ? Math.round(conversationStats.totalDuration / conversationStats.totalConversations)
                        : 0,
                    conversationsPerCustomer: agentData._count.customers > 0
                        ? Number((conversationStats.totalConversations / agentData._count.customers).toFixed(2))
                        : 0
                },
                conversationQuality: {
                    withTranscript: {
                        count: conversationStats.withTranscript,
                        percentage: conversationStats.totalConversations > 0
                            ? Number((conversationStats.withTranscript / conversationStats.totalConversations * 100).toFixed(2))
                            : 0
                    },
                    withFiles: {
                        count: conversationStats.withFiles,
                        percentage: conversationStats.totalConversations > 0
                            ? Number((conversationStats.withFiles / conversationStats.totalConversations * 100).toFixed(2))
                            : 0
                    }
                },
                customerInsights: {
                    topCustomers: Array.from(conversationStats.customerInteractions.entries())
                        .map(([customerId, data]) => ({
                            customerId,
                            customerName: data.name,
                            conversationCount: data.count,
                            totalDuration: data.duration,
                            avgDuration: Math.round(data.duration / data.count)
                        }))
                        .sort((a, b) => b.conversationCount - a.conversationCount)
                        .slice(0, 5)
                },
                trends: {
                    daily: Array.from(conversationStats.dailyMetrics.entries())
                        .map(([date, metrics]) => ({
                            date,
                            conversations: metrics.count,
                            avgDuration: Math.round(metrics.duration / metrics.count)
                        }))
                        .sort((a, b) => a.date.localeCompare(b.date))
                }
            };

            res.json(metrics);
        } catch (error) {
            next(error);
        }
    }
}