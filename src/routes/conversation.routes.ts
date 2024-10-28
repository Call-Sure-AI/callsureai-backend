import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { conversationValidation } from '../middleware/validators/conversation-validator';

const router = Router();
const controller = new ConversationController();

// Main CRUD routes
router.post('/', conversationValidation.create, controller.create);
router.get('/', conversationValidation.getAll, controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', conversationValidation.update, controller.update);
router.delete('/:id', controller.delete);

// Additional routes for specific queries
router.get('/customer/:customerId', controller.getConversationsByCustomer);
router.get('/agent/:agentId', controller.getConversationsByAgent);

export default router;