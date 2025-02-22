import { Request, Response } from 'express';
import { ActivityLogger } from '../utils/activity-logger';

export class ActivityController {
    static async getUserActivity(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const { limit, offset, entityType } = req.query;

            const activities = await ActivityLogger.getUserActivity(userId, {
                limit: limit ? parseInt(limit as string) : undefined,
                offset: offset ? parseInt(offset as string) : undefined,
                entityType: entityType as string,
            });

            return res.status(200).json(activities);
        } catch (error) {
            console.error('Error fetching user activity:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
} 