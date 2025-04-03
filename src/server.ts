import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { router } from './routes';
import { errorHandler } from './middleware/error-handler';
import { databaseErrorHandler } from './middleware/validators/database-error.middleware';

dotenv.config();

export const app = express();
const port = process.env.PORT || 3000;

BigInt.prototype.toJSON = function() {
    return this.toString();
  };
  
// Middleware
app.use(cors());
app.use(helmet());
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