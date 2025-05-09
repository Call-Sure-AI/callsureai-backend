// src/types/global.d.ts
import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: PrismaClient | undefined;
    namespace NodeJS {
        interface Global {
            prisma: PrismaClient | undefined;
        }
    }
    
    // Add this interface declaration for BigInt
    interface BigInt {
        toJSON(): string;
    }
}