import { PrismaService } from '../lib/prisma';

export type ActivityData = {
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata?: Record<string, any>;
};

export class ActivityLogger {
    static async log(data: ActivityData) {
        try {
            const prisma = await PrismaService.getInstance();
            await prisma.activity.create({
                data: {
                    user_id: data.user_id,
                    action: data.action,
                    entity_type: data.entity_type,
                    entity_id: data.entity_id,
                    metadata: data.metadata || {},
                },
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }

    static async getUserActivity(userId: string, options?: {
        limit?: number;
        offset?: number;
        entityType?: string;
    }) {
        const prisma = await PrismaService.getInstance();
        return prisma.activity.findMany({
            where: {
                user_id: userId,
                ...(options?.entityType ? { entity_type: options.entityType } : {}),
            },
            orderBy: {
                created_at: 'desc',
            },
            take: options?.limit || 50,
            skip: options?.offset || 0,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
} 