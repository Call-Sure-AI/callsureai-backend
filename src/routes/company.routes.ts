import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { createCompanySchema, updateCompanySchema } from '../middleware/validators/company-validator';
import { validateRequest } from '../middleware/validate';


const router = Router();

// TODO : Implement Auth Middleware
// router.use(authenticateUser);

router.get('', CompanyController.getAllForUser);
router.get('/:id', CompanyController.getById);
router.post('', validateRequest(createCompanySchema), CompanyController.create);
router.put('/:id', validateRequest(updateCompanySchema), CompanyController.update);
router.delete('/:id', CompanyController.delete);
router.post('/:id/regenerate-api-key', CompanyController.regenerateApiKey);

export default router;