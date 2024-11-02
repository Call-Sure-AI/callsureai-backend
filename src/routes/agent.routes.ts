import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { agentValidation } from '../middleware/validators/agent-validator';

const router = Router();
const controller = new AgentController();

router.post('/', agentValidation.create, controller.create);
router.get('/', controller.getAll);
router.get('/:pk', controller.getByPk);
router.put('/:pk', agentValidation.update, controller.update);
router.delete('/:pk', controller.delete);

router.get('/:pk/performance', controller.getPerformanceMetrics);

export default router;