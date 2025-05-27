import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router = Router();

// POST /api/email/send
router.post('/send', EmailController.sendEmail);

export default router; 