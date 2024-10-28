import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { PrismaService } from '../lib/prisma';

export class CustomerController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, description } = req.body;

            const prisma = await PrismaService.getInstance();

            const customer = await prisma.customer.create({
                data: { name, description },
            });
            res.status(201).json(customer);
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const prisma = await PrismaService.getInstance();

            const customers = await prisma.customer.findMany({
                include: {
                    bus_cus: {
                        include: {
                            business: true,
                        },
                    },
                    cust_agent: {
                        include: {
                            agent: true,
                        },
                    },
                },
            });
            res.json(customers);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const prisma = await PrismaService.getInstance();

            const customer = await prisma.customer.findUnique({
                where: { id },
                include: {
                    bus_cus: {
                        include: {
                            business: true,
                        },
                    },
                    cust_agent: {
                        include: {
                            agent: true,
                        },
                    },
                },
            });

            if (!customer) {
                throw new AppError('Customer not found', 404);
            }

            res.json(customer);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const prisma = await PrismaService.getInstance();

            const customer = await prisma.customer.update({
                where: { id },
                data: { name, description },
            });
            res.json(customer);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const prisma = await PrismaService.getInstance();

            await prisma.customer.delete({
                where: { id },
            });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async createBulk(req: Request, res: Response, next: NextFunction) {
        try {
            const customers = req.body;

            if (!Array.isArray(customers)) {
                throw new AppError('Input must be an array of customers', 400);
            }

            const isValid = customers.every(customer => {
                return (
                    customer.name &&
                    typeof customer.name === 'string' &&
                    customer.name.trim().length > 0 &&
                    customer.description &&
                    typeof customer.description === 'string' &&
                    customer.description.trim().length > 0
                );
            });

            if (!isValid) {
                throw new AppError('Invalid customer data in bulk create request', 400);
            }

            const prisma = await PrismaService.getInstance();

            const createdCustomers = await prisma.customer.createMany({
                data: customers,
                skipDuplicates: true,
            });

            const createdCustomerRecords = await prisma.customer.findMany({
                where: {
                    OR: customers.map(customer => ({
                        name: customer.name,
                        description: customer.description,
                    })),
                },
                take: customers.length,
            });

            res.status(201).json(createdCustomerRecords);
        } catch (error) {
            next(error);
        }
    }
}