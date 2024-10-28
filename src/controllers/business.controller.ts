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
                    customers: true
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
                    customers: true,
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

            const business = await prisma.businessAccount.findUnique({
                where: { id: businessId }
            });

            if (!business) {
                throw new AppError('Business not found', 404);
            }

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

            const businessData = await prisma.businessAccount.findUnique({
                where: { id: businessId },
                include: {
                    customers: {
                        include: {
                            conversations: {
                                where: {
                                    timeDate: {
                                        gte: startDate,
                                        lte: now
                                    }
                                },
                                include: {
                                    agent: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!businessData) {
                throw new AppError('Error retrieving business data', 500);
            }

            const totalCustomers = businessData.customers.length;

            let totalConversations = 0;
            let totalDuration = 0;
            const agentMetrics = new Map<string, {
                name: string;
                conversationCount: number;
                totalDuration: number;
            }>();
            const dailyConversations = new Map<string, number>();
            const customersWithConversations = new Set();

            businessData.customers.forEach(customer => {
                if (customer.conversations.length > 0) {
                    customersWithConversations.add(customer.id);

                    customer.conversations.forEach(conv => {
                        totalConversations++;
                        totalDuration += conv.duration;

                        const agentData = agentMetrics.get(conv.agent.id) || {
                            name: conv.agent.name,
                            conversationCount: 0,
                            totalDuration: 0
                        };
                        agentData.conversationCount++;
                        agentData.totalDuration += conv.duration;
                        agentMetrics.set(conv.agent.id, agentData);

                        const dateKey = conv.timeDate.toISOString().split('T')[0];
                        dailyConversations.set(dateKey, (dailyConversations.get(dateKey) || 0) + 1);
                    });
                }
            });

            const agentPerformance = Array.from(agentMetrics.entries()).map(([agentId, data]) => ({
                agentId,
                agentName: data.name,
                conversationCount: data.conversationCount,
                totalDuration: data.totalDuration,
                averageDuration: Math.round(data.totalDuration / data.conversationCount)
            })).sort((a, b) => b.conversationCount - a.conversationCount);

            const conversationTrends = Array.from(dailyConversations.entries())
                .map(([date, count]) => ({
                    date,
                    count
                }))
                .sort((a, b) => a.date.localeCompare(b.date));

            const activeCustomersCount = customersWithConversations.size;

            const metrics = {
                timeframe,
                customerMetrics: {
                    totalCustomers,
                    activeCustomers: activeCustomersCount,
                    engagementRate: totalCustomers > 0
                        ? Number((activeCustomersCount / totalCustomers * 100).toFixed(2))
                        : 0
                },
                conversationMetrics: {
                    totalConversations,
                    averageDuration: totalConversations > 0
                        ? Math.round(totalDuration / totalConversations)
                        : 0,
                    conversationsPerCustomer: activeCustomersCount > 0
                        ? Number((totalConversations / activeCustomersCount).toFixed(2))
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

            res.json(metrics);
        } catch (error) {
            next(error);
        }
    }
}