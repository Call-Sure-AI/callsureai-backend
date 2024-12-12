import { PrismaClient } from '@prisma/client';

class PrismaService {
    private static instance: PrismaClient;
    private static isConnected: boolean = false;

    static async getInstance(): Promise<PrismaClient> {
        if (!this.instance) {
            this.instance = new PrismaClient({
                log: ['error', 'warn'],
            });
        }

        // Try to connect if not already connected
        if (!this.isConnected) {
            try {
                await this.instance.$connect();
                this.isConnected = true;
            } catch (error) {
                this.isConnected = false;
                throw error;
            }
        }

        return this.instance;
    }

    static async disconnect(): Promise<void> {
        if (this.instance && this.isConnected) {
            await this.instance.$disconnect();
            this.isConnected = false;
        }
    }
}

export { PrismaService };