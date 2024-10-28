// src/middleware/database-error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const databaseErrorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return res.status(503).json({
            error: 'Database connection failed'
        });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P1001':
            case 'P1002':
                return res.status(503).json({
                    error: 'Database connection failed'
                });
            case 'P2021':
            case 'P2022':
                return res.status(500).json({
                    error: 'Database schema error'
                });
            default:
                return res.status(500).json({
                    error: 'Database error occurred'
                });
        }
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        return res.status(500).json({
            error: 'Database error occurred'
        });
    }

    next(error);
};