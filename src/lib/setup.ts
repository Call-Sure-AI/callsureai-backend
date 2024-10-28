import * as dotenv from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}
