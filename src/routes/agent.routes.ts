import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { createAgentSchema, updateAgentSchema } from '../middleware/validators/agent-validator';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.get('', AgentController.getAll);
router.get('/:id', AgentController.getById);
router.get('/:user_id', AgentController.getByUserId);
router.post('', validateRequest(createAgentSchema), AgentController.create);
router.put('/:id', validateRequest(updateAgentSchema), AgentController.update);
router.delete('/:id', AgentController.delete);

export default router;