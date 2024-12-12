import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { createCompanySchema, updateCompanySchema } from '../middleware/validators/company-validator';
import { validateRequest } from '../middleware/validate';


const router = Router();

// TODO : Implement Auth Middleware
// router.use(authenticateUser);

router.get('/companies', CompanyController.getAllForUser);
router.get('/companies/:id', CompanyController.getById);
router.post('/companies', validateRequest(createCompanySchema), CompanyController.create);
router.put('/companies/:id', validateRequest(updateCompanySchema), CompanyController.update);
router.delete('/companies/:id', CompanyController.delete);
router.post('/companies/:id/regenerate-api-key', CompanyController.regenerateApiKey);

export default router;