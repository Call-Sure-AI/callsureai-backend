import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { Prisma } from '@prisma/client';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: err.message
        });
    }

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (err.code === 'P2023') {
            return res.status(404).json({
                error: 'Invalid ID format'
            });
        }

        // Record not found
        if (err.code === 'P2025') {
            return res.status(404).json({
                error: 'Record not found'
            });
        }
    }

    // Handle other Prisma errors
    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            error: 'Invalid input data'
        });
    }

    // Default error
    console.error(err);
    return res.status(500).json({
        error: 'Internal server error'
    });
};