import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { createCompanySchema, updateCompanySchema } from '../middleware/validators/company-validator';
import { validateRequest } from '../middleware/validate';


const router = Router();

// TODO : Implement Auth Middleware
// router.use(authenticateUser);

router.get('', CompanyController.getAllForUser);
router.get('/:id', CompanyController.getById);
router.get('/user/:user_id', CompanyController.getByUserId);
router.post('', validateRequest(createCompanySchema), CompanyController.create);
router.post('/create-or-update', validateRequest(createCompanySchema), CompanyController.createOrUpdate);
router.put('/:id', validateRequest(updateCompanySchema), CompanyController.update);
router.delete('/:id', CompanyController.delete);
router.post('/:id/regenerate-api-key', CompanyController.regenerateApiKey);

export default router;