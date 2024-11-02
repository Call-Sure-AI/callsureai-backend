import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller';
import { businessValidation } from '../middleware/validators/business-validator';

const router = Router();
const controller = new BusinessController();

router.post('/', businessValidation.create, controller.create);
router.get('/', controller.getAll);
router.get('/:pk', controller.getByPk);
router.put('/:pk', businessValidation.update, controller.update);
router.delete('/:pk', controller.delete);

router.get('/:pk/metrics', controller.getMetrics);

export default router;