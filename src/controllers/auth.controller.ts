import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { SignInInput, SignUpInput } from '../middleware/validators/auth-validators'

const prisma = new PrismaClient()

export class AuthController {
    static async signUp(req: Request, res: Response) {
        try {
            const { email, password, name } = req.body as SignUpInput

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            })

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' })
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10)

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    name,
                    accounts: {
                        create: {
                            type: 'credentials',
                            provider: 'credentials',
                            providerAccountId: email,
                            access_token: hashedPassword,
                        },
                    },
                },
            })

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1d' }
            )

            return res.status(201).json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token,
            })
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' })
        }
    }

    static async signIn(req: Request, res: Response) {
        try {
            const { email, password } = req.body as SignInInput

            // Find user
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    accounts: {
                        where: {
                            provider: 'credentials',
                        },
                    },
                },
            })

            if (!user || !user.accounts[0]) {
                return res.status(401).json({ error: 'Invalid credentials' })
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(
                password,
                user.accounts[0].access_token || ''
            )

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' })
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1d' }
            )

            return res.status(200).json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token,
            })
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' })
        }
    }

    static async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user.id

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            })

            if (!user) {
                return res.status(404).json({ error: 'User not found' })
            }

            return res.status(200).json(user)
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' })
        }
    }
}