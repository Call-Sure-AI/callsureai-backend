import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

declare global {
    namespace Express {
        interface Request {
            user?: any
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]

        if (!token) {
            return res.status(401).json({ error: 'Missing authentication token' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'callsure')
        req.user = decoded

        next()
    } catch (error) {
        return res.status(401).json({ error: 'Invalid authentication token' })
    }
}

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