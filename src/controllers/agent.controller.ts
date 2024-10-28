import { Request, Response, NextFunction } from 'express';

import { PrismaService } from '../lib/prisma';
import { AppError } from '../utils/app-error';


export class AgentController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, spec, description } = req.body;

            const prisma = await PrismaService.getInstance();

            const agent = await prisma.agentInfo.create({
                data: { name, spec, description },
            });
            res.status(201).json(agent);
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const prisma = await PrismaService.getInstance();

            const agents = await prisma.agentInfo.findMany({
                include: {
                    agents: {
                        include: {
                            customer: true,
                            conversations: true,
                        },
                    },
                },
            });
            res.json(agents);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const prisma = await PrismaService.getInstance();

            const agent = await prisma.agentInfo.findUnique({
                where: { id },
                include: {
                    agents: {
                        include: {
                            customer: true,
                            conversations: true,
                        },
                    },
                },
            });

            if (!agent) {
                throw new AppError('Agent not found', 404);
            }

            res.json(agent);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, spec, description } = req.body;

            const prisma = await PrismaService.getInstance();

            const agent = await prisma.agentInfo.update({
                where: { id },
                data: { name, spec, description },
            });
            res.json(agent);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const prisma = await PrismaService.getInstance();

            await prisma.agentInfo.delete({
                where: { id },
            });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getPerformanceMetrics(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const timeframe = (req.query.timeframe as string) || '30d';

            const prisma = await PrismaService.getInstance();

            // Verify agent exists
            const agent = await prisma.agentInfo.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    spec: true,
                    description: true,
                    generate: true
                }
            });

            if (!agent) {
                throw new AppError('Agent not found', 404);
            }

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

            // Get all customer-agent connections with conversations
            const custAgentConnections = await prisma.cust_Agent.findMany({
                where: {
                    agentID: id
                },
                include: {
                    customer: true,
                    conversations: {
                        where: {
                            timeDate: {
                                gte: startDate,
                                lte: now
                            }
                        },
                        orderBy: {
                            timeDate: 'asc'
                        }
                    }
                }
            });

            // Calculate conversation metrics
            let totalConversations = 0;
            let totalDuration = 0;
            let totalCustomers = custAgentConnections.length;
            let activeCustomers = 0;
            let conversationsWithTranscript = 0;
            let conversationsWithFiles = 0;
            const dailyMetrics = new Map();
            const customerInteractions = new Map();

            custAgentConnections.forEach(connection => {
                const conversations = connection.conversations;
                if (conversations.length > 0) {
                    activeCustomers++;
                }

                conversations.forEach(conv => {
                    totalConversations++;
                    totalDuration += conv.duration;

                    // Track transcript and file usage
                    if (conv.transcript) conversationsWithTranscript++;
                    if (conv.file) conversationsWithFiles++;

                    // Track daily metrics
                    const dateKey = conv.timeDate.toISOString().split('T')[0];
                    const dailyData = dailyMetrics.get(dateKey) || {
                        conversationCount: 0,
                        totalDuration: 0,
                        avgDuration: 0
                    };
                    dailyData.conversationCount++;
                    dailyData.totalDuration += conv.duration;
                    dailyData.avgDuration = dailyData.totalDuration / dailyData.conversationCount;
                    dailyMetrics.set(dateKey, dailyData);

                    // Track customer interaction frequency
                    const customerData = customerInteractions.get(connection.customerID) || {
                        customerName: connection.customer.name,
                        conversationCount: 0,
                        totalDuration: 0
                    };
                    customerData.conversationCount++;
                    customerData.totalDuration += conv.duration;
                    customerInteractions.set(connection.customerID, customerData);
                });
            });

            // Calculate averages and trends
            const avgDuration = totalConversations > 0 ? Math.round(totalDuration / totalConversations) : 0;
            const conversationsPerDay = Array.from(dailyMetrics.entries()).map(([date, metrics]) => ({
                date,
                conversations: metrics.conversationCount,
                avgDuration: Math.round(metrics.avgDuration)
            }));

            // Get top customers by interaction
            const topCustomers = Array.from(customerInteractions.entries())
                .map(([customerId, data]) => ({
                    customerId,
                    customerName: data.customerName,
                    conversationCount: data.conversationCount,
                    totalDuration: data.totalDuration,
                    avgDuration: Math.round(data.totalDuration / data.conversationCount)
                }))
                .sort((a, b) => b.conversationCount - a.conversationCount)
                .slice(0, 5);

            // Calculate version statistics
            const versionStats = await prisma.conversation.groupBy({
                by: ['version'],
                where: {
                    custAgent: {
                        agentID: id
                    },
                    timeDate: {
                        gte: startDate,
                        lte: now
                    }
                },
                _count: true
            });

            const metrics = {
                timeframe,
                agentInfo: {
                    ...agent,
                },
                overview: {
                    totalConversations,
                    totalCustomers,
                    activeCustomers,
                    avgConversationDuration: avgDuration,
                    conversationsPerCustomer: activeCustomers > 0
                        ? Number((totalConversations / activeCustomers).toFixed(2))
                        : 0,
                    customerEngagementRate: totalCustomers > 0
                        ? Number((activeCustomers / totalCustomers * 100).toFixed(2))
                        : 0
                },
                conversationQuality: {
                    withTranscript: {
                        count: conversationsWithTranscript,
                        percentage: totalConversations > 0
                            ? Number((conversationsWithTranscript / totalConversations * 100).toFixed(2))
                            : 0
                    },
                    withFiles: {
                        count: conversationsWithFiles,
                        percentage: totalConversations > 0
                            ? Number((conversationsWithFiles / totalConversations * 100).toFixed(2))
                            : 0
                    },
                    versionDistribution: versionStats.map(stat => ({
                        version: stat.version,
                        count: stat._count,
                        percentage: Number((stat._count / totalConversations * 100).toFixed(2))
                    }))
                },
                customerInsights: {
                    topCustomers,
                    customerRetention: totalCustomers > 0
                        ? Number((activeCustomers / totalCustomers * 100).toFixed(2))
                        : 0
                },
                trends: {
                    daily: conversationsPerDay
                }
            };

            res.json(metrics);
        } catch (error) {
            next(error);
        }
    }
}