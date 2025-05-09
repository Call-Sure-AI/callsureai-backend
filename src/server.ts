import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { router } from './routes';
import { errorHandler } from './middleware/error-handler';
import { databaseErrorHandler } from './middleware/validators/database-error.middleware';

dotenv.config();

export const app = express();
const port = process.env.PORT || 3000;

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

// Middleware
const allowedOrigins = ['http://localhost:3000', 'https://callsure.ai', 'https://www.callsure.ai', 'https://callsure-ai-frontend.vercel.app', 'https://www.callsure-ai-frontend.vercel.app', 'https://beta.callsure.ai'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        if (origin.match(/^https:\/\/([a-zA-Z0-9-]+\.)*callsure\.ai$/)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

app.set('trust proxy', 1);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({
    extended: true,
    limit: '20mb',
    parameterLimit: 50000
}));

// Routes
app.use('/api', router);

// Error handling
app.use(errorHandler);
app.use(databaseErrorHandler);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});