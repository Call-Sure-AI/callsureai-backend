import { Router } from 'express';
import businessRoutes from './business.routes';
import customerRoutes from './customer.routes';
import agentRoutes from './agent.routes';
import conversationRoutes from './conversation.routes';

const router = Router();

router.use('/businesses', businessRoutes);
router.use('/customers', customerRoutes);
router.use('/agents', agentRoutes);
router.use('/conversations', conversationRoutes);

export { router };