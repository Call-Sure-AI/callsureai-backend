
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware';
import { InvitationController } from '../controllers/invitation.controller';
import { validateRequest } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const invitationIdSchema = z.object({
    invitationId: z.string().uuid(),
})

const generateInvitationSchema = z.object({
    email: z.string().email('Invalid email address'),
    companyId: z.string().uuid(),
    role: z.string().optional(),
})

router.post(
    '/generate',
    authMiddleware,
    validateRequest(generateInvitationSchema),
    InvitationController.generateInvitation
);

router.get(
    '/validate/:token',
    InvitationController.validateInvitation
);

router.post(
    '/accept/:token',
    InvitationController.acceptInvitation
);

router.get(
    '/list/:companyId',
    authMiddleware,
    InvitationController.listInvitations
);

router.delete(
    '/:invitationId',
    authMiddleware,
    InvitationController.deleteInvitation
);

router.post(
    '/send-email',
    authMiddleware,
    validateRequest(invitationIdSchema),
    InvitationController.sendInvitationEmail
);

export default router;