import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller';
import { businessValidation } from '../middleware/validators/business-validator';

const router = Router();
const controller = new BusinessController();

router.post('/', businessValidation.create, controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', businessValidation.update, controller.update);
router.delete('/:id', controller.delete);

router.get('/:id/metrics', controller.getMetrics);

export default router;