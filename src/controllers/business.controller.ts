import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { PrismaService } from '../lib/prisma';

export class BusinessController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, desc, report } = req.body;

            const prisma = await PrismaService.getInstance();

            const business = await prisma.businessAccount.create({
                data: { type, desc, report },
            });
            res.status(201).json(business);
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            let page = Math.max(1, Number(req.query.page) || 1);
            let limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

            const skip = (page - 1) * limit;

            const prisma = await PrismaService.getInstance();

            const totalCount = await prisma.businessAccount.count();

            const totalPages = Math.ceil(totalCount / limit);

            if (page > totalPages && totalPages > 0) {
                page = totalPages;
            }

            const businesses = await prisma.businessAccount.findMany({
                skip,
                take: limit,
                include: {
                    bus_cus: {
                        include: {
                            customer: true,
                        },
                    },
                },
                orderBy: {
                    id: 'asc',
                },
            });

            res.json({
                data: businesses,
                metadata: {
                    currentPage: page,
                    pageSize: limit,
                    totalPages,
                    totalCount,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const prisma = await PrismaService.getInstance();

            const business = await prisma.businessAccount.findUnique({
                where: { id },
                include: {
                    bus_cus: {
                        include: {
                            customer: true,
                        },
                    },
                },
            });

            if (!business) {
                throw new AppError('Business not found', 404);
            }

            res.json(business);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { type, desc, report } = req.body;

            const prisma = await PrismaService.getInstance();

            const business = await prisma.businessAccount.update({
                where: { id },
                data: { type, desc, report },
            });
            res.json(business);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const prisma = await PrismaService.getInstance();

            await prisma.businessAccount.delete({
                where: { id },
            });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getMetrics(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: businessId } = req.params;

            const timeframe = (req.query.timeframe as string) || '30d';

            const prisma = await PrismaService.getInstance();

            // Verify business exists
            const business = await prisma.businessAccount.findUnique({
                where: { id: businessId }
            });

            if (!business) {
                throw new AppError('Business not found', 404);
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

            // Get all customers associated with this business
            const businessCustomers = await prisma.bus_Cus.findMany({
                where: { busID: businessId },
                include: {
                    customer: {
                        include: {
                            cust_agent: {
                                include: {
                                    agent: true,
                                    conversations: {
                                        where: {
                                            timeDate: {
                                                gte: startDate,
                                                lte: now
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }).catch(error => {
                throw new AppError('Error fetching business data: ' + error.message, 500);
            });

            if (!businessCustomers) {
                throw new AppError('Error retrieving business customers', 500);
            }

            // Customer Metrics
            const totalCustomers = businessCustomers.length;

            // Conversation Metrics
            let totalConversations = 0;
            let totalDuration = 0;
            let customersWithConversations = 0;
            const agentConversations = new Map();
            const dailyConversations = new Map();

            businessCustomers.forEach(busCus => {
                let hasConversation = false;
                busCus.customer.cust_agent.forEach(custAgent => {
                    const conversationsCount = custAgent.conversations.length;
                    if (conversationsCount > 0) {
                        hasConversation = true;
                        totalConversations += conversationsCount;

                        // Track conversations per agent
                        const currentCount = agentConversations.get(custAgent.agent.id) || {
                            agentName: custAgent.agent.name,
                            count: 0,
                            totalDuration: 0
                        };

                        custAgent.conversations.forEach(conv => {
                            totalDuration += conv.duration;
                            currentCount.count += 1;
                            currentCount.totalDuration += conv.duration;

                            // Track daily conversations
                            const dateKey = conv.timeDate.toISOString().split('T')[0];
                            const dailyCount = dailyConversations.get(dateKey) || 0;
                            dailyConversations.set(dateKey, dailyCount + 1);
                        });

                        agentConversations.set(custAgent.agent.id, currentCount);
                    }
                });
                if (hasConversation) customersWithConversations++;
            });

            // Calculate average durations
            const averageConversationDuration = totalConversations > 0
                ? Math.round(totalDuration / totalConversations)
                : 0;

            // Get agent performance metrics
            const agentPerformance = Array.from(agentConversations.entries()).map(([agentId, data]) => ({
                agentId,
                agentName: data.agentName,
                conversationCount: data.count,
                totalDuration: data.totalDuration,
                averageDuration: Math.round(data.totalDuration / data.count)
            }));

            // Sort agent performance by conversation count
            agentPerformance.sort((a, b) => b.conversationCount - a.conversationCount);

            // Get conversation trends
            const conversationTrends = Array.from(dailyConversations.entries())
                .map(([date, count]) => ({
                    date,
                    count
                }))
                .sort((a, b) => a.date.localeCompare(b.date));

            const metrics = {
                timeframe,
                customerMetrics: {
                    totalCustomers,
                    activeCustomers: customersWithConversations,
                    engagementRate: totalCustomers > 0
                        ? Number((customersWithConversations / totalCustomers * 100).toFixed(2))
                        : 0
                },
                conversationMetrics: {
                    totalConversations,
                    averageDuration: averageConversationDuration,
                    conversationsPerCustomer: customersWithConversations > 0
                        ? Number((totalConversations / customersWithConversations).toFixed(2))
                        : 0
                },
                agentMetrics: {
                    totalAgents: agentPerformance.length,
                    agentPerformance,
                    topPerformers: agentPerformance.slice(0, 5)
                },
                trends: {
                    dailyConversations: conversationTrends
                },
                businessType: business.type,
                reportingSummary: {
                    hasDetailedReports: business.report ? true : false,
                    businessDescription: business.desc
                }
            };

            if (!metrics || typeof metrics !== 'object') {
                throw new AppError('Error generating metrics', 500);
            }

            res.json(metrics);
        } catch (error) {
            next(error);
        }
    }
}