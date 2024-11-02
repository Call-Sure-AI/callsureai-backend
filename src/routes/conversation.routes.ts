import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { conversationValidation } from '../middleware/validators/conversation-validator';

const router = Router();
const controller = new ConversationController();

// Main CRUD routes
router.post('/', conversationValidation.create, controller.create);
router.get('/', conversationValidation.getAll, controller.getAll);
router.get('/:pk', controller.getByPk);
router.put('/:pk', conversationValidation.update, controller.update);
router.delete('/:pk', controller.delete);

// Additional routes for specific queries
router.get('/customer/:customerPk', controller.getByCustomerPk);
router.get('/agent/:agentPk', controller.getByAgentPk);

export default router;