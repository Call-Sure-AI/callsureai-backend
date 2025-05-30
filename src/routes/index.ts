import { Router } from 'express';


import authRoutes from './auth.routes'
import companyRoutes from './company.routes'
import agentRoutes from './agent.routes'
import s3Routes from './s3.routes'
import activityRoutes from './activity.routes'
import invitationRoutes from './invitation.routes'
import emailRoutes from './email.routes'

const router = Router();

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/agent', agentRoutes);
router.use('/check-status', (req, res) => res.status(200).json({ message: '🟩 active' }));
router.use('/files', s3Routes);
router.use('/activity', activityRoutes);
router.use('/invitations', invitationRoutes);
router.use('/email', emailRoutes);

export { router };