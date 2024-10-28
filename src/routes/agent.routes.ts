import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { agentValidation } from '../middleware/validators/agent-validator';

const router = Router();
const controller = new AgentController();

router.post('/', agentValidation.create, controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', agentValidation.update, controller.update);
router.delete('/:id', controller.delete);

router.get('/:id/performance', controller.getPerformanceMetrics);

export default router;