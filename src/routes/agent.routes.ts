import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { createAgentSchema, updateAgentSchema } from '../middleware/validators/agent-validator';
import { validateRequest } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.get('', authMiddleware, AgentController.getAll);
router.get('/user/:user_id', authMiddleware, AgentController.getByUserId);
router.post('', authMiddleware, validateRequest(createAgentSchema), AgentController.create);
router.put('/:id', authMiddleware, validateRequest(updateAgentSchema), AgentController.update);
router.delete('/:id', authMiddleware, AgentController.delete);

export default router;