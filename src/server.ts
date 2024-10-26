import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { routes } from './routes';
import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use("/", (req, res) => {
    res.send("Welcome to Callsure Ai API");
});
app.use('/api', routes);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});