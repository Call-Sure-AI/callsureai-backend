import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { createAgentSchema, updateAgentSchema } from '../middleware/validators/agent-validator';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.get('/agents', AgentController.getAll);
router.get('/agents/:id', AgentController.getById);
router.post('/agents', validateRequest(createAgentSchema), AgentController.create);
router.put('/agents/:id', validateRequest(updateAgentSchema), AgentController.update);
router.delete('/agents/:id', AgentController.delete);

export default router;