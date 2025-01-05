import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { PrismaService } from '../lib/prisma';

declare global {
    namespace Express {
        interface Request {
            user?: any
        }
    }
}

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const prisma = await PrismaService.getInstance();

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true }
            });

            if (!user) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            req.user = {
                id: decoded.id,
                email: decoded.email,
            };
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const validateRequest = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body)
            next()
        } catch (error: any) {
            return res.status(400).json({ error: error.errors })
        }
    }
}