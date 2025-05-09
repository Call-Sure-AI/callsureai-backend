import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { createCompanySchema, updateCompanySchema } from '../middleware/validators/company-validator';
import { validateRequest } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth-middleware';


const router = Router();

router.get('', authMiddleware, CompanyController.getById);
router.post('/create-or-update', authMiddleware, validateRequest(createCompanySchema), CompanyController.createOrUpdate);
router.put('/:id', authMiddleware, validateRequest(updateCompanySchema), CompanyController.update);
router.delete('/:id', authMiddleware, CompanyController.delete);
router.post('/:id/regenerate-api-key', authMiddleware, CompanyController.regenerateApiKey);

export default router;