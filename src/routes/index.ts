import { Router } from 'express';
import authRoutes from './auth.routes'
import companyRoutes from './company.routes'
import agentRoutes from './agent.routes'

const router = Router();

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/agent', agentRoutes);
router.use('/check-status', (req, res) => res.status(200).json({ message: 'active' }))

export { router };