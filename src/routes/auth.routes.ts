import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware, validateRequest } from '../middleware/auth-middleware'
import { emailSchema, signInSchema, signUpSchema } from '../middleware/validators/auth-validators'

const router = Router()



// Public routes
router.post('/signup', validateRequest(signUpSchema), AuthController.signUp)
router.post('/signin', validateRequest(signInSchema), AuthController.signIn)
router.post('/google', AuthController.googleAuth)
router.post('/check-email', validateRequest(emailSchema), AuthController.checkEmail);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile)
// router.post('/refresh-google-token', authMiddleware, AuthController.refreshGoogleToken)

export default router