import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { PrismaService } from '../lib/prisma';

export class CustomerController {
    private validateCustomerData = (data: any): boolean => {
        return (
            data.name &&
            typeof data.name === 'string' &&
            data.name.trim().length > 0 &&
            data.description &&
            typeof data.description === 'string' &&
            data.description.trim().length > 0
        );
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, description } = req.body;

            if (!this.validateCustomerData({ name, description })) {
                throw new AppError('Invalid customer data', 400);
            }

            const prisma = await PrismaService.getInstance();
            const customer = await prisma.customer.create({
                data: { name, description },
                include: {
                    businesses: true,
                    agents: true,
                    conversations: true
                }
            });

            res.status(201).json(customer);
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const prisma = await PrismaService.getInstance();
            const { page = '1', limit = '10' } = req.query;

            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            const take = parseInt(limit as string);

            const [customers, total] = await Promise.all([
                prisma.customer.findMany({
                    skip,
                    take,
                    include: {
                        businesses: {
                            select: {
                                id: true,
                                type: true,
                                desc: true
                            }
                        },
                        agents: {
                            select: {
                                id: true,
                                name: true,
                                spec: true
                            }
                        },
                        conversations: {
                            select: {
                                id: true,
                                timeDate: true,
                                duration: true
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
                prisma.customer.count()
            ]);

            res.json({
                data: customers,
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
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const prisma = await PrismaService.getInstance();

            const customer = await prisma.customer.findUnique({
                where: { id },
                include: {
                    businesses: {
                        select: {
                            id: true,
                            type: true,
                            desc: true
                        }
                    },
                    agents: {
                        select: {
                            id: true,
                            name: true,
                            spec: true
                        }
                    },
                    conversations: {
                        select: {
                            id: true,
                            timeDate: true,
                            duration: true,
                            exchange: true,
                            agent: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        },
                        orderBy: {
                            timeDate: 'desc'
                        }
                    }
                }
            });

            if (!customer) {
                throw new AppError('Customer not found', 404);
            }

            res.json(customer);
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            if (!this.validateCustomerData({ name, description })) {
                throw new AppError('Invalid customer data', 400);
            }

            const prisma = await PrismaService.getInstance();

            const customer = await prisma.customer.update({
                where: { id },
                data: { name, description },
                include: {
                    businesses: true,
                    agents: true
                }
            });

            res.json(customer);
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const prisma = await PrismaService.getInstance();

            const customerExists = await prisma.customer.findUnique({
                where: { id },
                select: { id: true }
            });

            if (!customerExists) {
                throw new AppError('Customer not found', 404);
            }

            await prisma.customer.delete({
                where: { id }
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    createBulk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customers = req.body;

            if (!Array.isArray(customers)) {
                throw new AppError('Input must be an array of customers', 400);
            }

            const isValid = customers.every(customer => this.validateCustomerData(customer));

            if (!isValid) {
                throw new AppError('Invalid customer data in bulk create request', 400);
            }

            const prisma = await PrismaService.getInstance();

            const createdCustomers = await prisma.$transaction(async (tx) => {
                await tx.customer.createMany({
                    data: customers,
                    skipDuplicates: true
                });

                return tx.customer.findMany({
                    where: {
                        OR: customers.map(customer => ({
                            name: customer.name,
                            description: customer.description
                        }))
                    },
                    include: {
                        businesses: true,
                        agents: true
                    },
                    orderBy: {
                        name: 'asc'
                    }
                });
            });

            res.status(201).json(createdCustomers);
        } catch (error) {
            next(error);
        }
    };
}