import { Router } from 'express'
import { signInSchema, signUpSchema } from '../middleware/validators/auth-validators'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware, validateRequest } from '../middleware/auth-middleware'
const router = Router()

// Public routes
router.post('/signup', validateRequest(signUpSchema), AuthController.signUp)
router.post('/signin', validateRequest(signInSchema), AuthController.signIn)

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile)

export default router;