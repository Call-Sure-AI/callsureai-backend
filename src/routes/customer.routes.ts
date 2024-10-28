import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { customerValidation } from '../middleware/validators/customer-validator';

const router = Router();
const controller = new CustomerController();

router.post('/', customerValidation.create, controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', customerValidation.update, controller.update);
router.delete('/:id', controller.delete);

router.post('/bulk', controller.createBulk.bind(controller));

export default router;