import { Router } from 'express';
import authRoutes from './auth.routes'

const router = Router();

router.use('/auth', authRoutes)
router.use('/ping', (req, res) => res.status(200).json({ message: 'pong' }))

export { router };