import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware, validateRequest } from '../middleware/auth-middleware'
import { emailSchema, signInSchema, signUpSchema } from '../middleware/validators/auth-validators'

const router = Router()



// Public routes
// /api/auth/*
router.post('/signup', validateRequest(signUpSchema), AuthController.signUp)
router.post('/signin', validateRequest(signInSchema), AuthController.signIn)
router.post('/google', AuthController.googleAuth)
router.post('/check-email', validateRequest(emailSchema), AuthController.checkEmail);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile)
// router.post('/refresh-google-token', authMiddleware, AuthController.refreshGoogleToken)

// POST /api/auth/generate-otp
router.post('/generate-otp', AuthController.generateOTP);

// POST /api/auth/verify-otp
router.post('/verify-otp', AuthController.verifyOTP);

export default router