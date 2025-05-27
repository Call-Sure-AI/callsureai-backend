import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { SignInInput, SignUpInput } from '../middleware/validators/auth-validators'
import { OAuth2Client } from 'google-auth-library'
import { PrismaService } from '../lib/prisma'
import { EmailController } from './email.controller'

const prismaClient = new PrismaClient();

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage'
);

export class AuthController {
    static async googleAuth(req: Request, res: Response) {
        try {
            const { idToken } = req.body;
            let newUser = false;

            if (!idToken) {
                return res.status(400).json({ error: 'ID token is required' });
            }

            // Verify the ID token
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();

            if (!payload) {
                return res.status(400).json({ error: 'Invalid Google token' });
            }

            const {
                sub: googleId,
                email,
                name,
                picture: image,
                email_verified: emailVerified
            } = payload;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            // Find or create user
            let user: any = await prismaClient.user.findUnique({
                where: { email },
                include: {
                    accounts: {
                        where: {
                            provider: 'google'
                        }
                    },
                    ownedCompanies: true,
                    companyMemberships: true,
                }
            });

            if (!user) {
                // Create new user
                newUser = true;
                user = await prismaClient.user.create({
                    data: {
                        email,
                        name: name || email.split('@')[0],
                        image,
                        emailVerified: emailVerified ? new Date() : null,
                        accounts: {
                            create: {
                                type: 'oauth',
                                provider: 'google',
                                providerAccountId: googleId,
                                access_token: idToken,
                            }
                        }
                    },
                    include: {
                        accounts: true
                    }
                });
            } else if (!user.accounts.length) {
                // Link Google account to existing user
                await prismaClient.account.create({
                    data: {
                        userId: user.id,
                        type: 'oauth',
                        provider: 'google',
                        providerAccountId: googleId,
                        access_token: idToken,
                    }
                });
            }

            const role = user.ownedCompanies.length ? 'admin' : user.companyMemberships.length ? user.companyMemberships[0].role : 'member';

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role,
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            res.cookie('token', token);
            res.cookie('user', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role,
            }));

            console.log('Response headers:', res.getHeaders());
            console.log('Set-Cookie header:', res.getHeader('Set-Cookie'));

            return res.status(200).json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role,
                },
                newUser,
                companies: user.ownedCompanies
            });

        } catch (error: any) {
            console.error('Google auth error:', error);
            return res.status(500).json({
                error: 'Authentication failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // static async refreshGoogleToken(req: Request, res: Response) {
    //     try {
    //         const userId = req.user.id
    //         const user = await prisma.user.findUnique({
    //             where: { id: userId },
    //             include: {
    //                 accounts: {
    //                     where: {
    //                         provider: 'google',
    //                     },
    //                 },
    //             },
    //         })

    //         if (!user || !user.accounts[0]?.refresh_token) {
    //             return res.status(400).json({ error: 'No Google account found' })
    //         }

    //         const { refresh_token } = user.accounts[0]

    //         // Refresh the token
    //         const { tokens } = await googleClient.refreshToken(refresh_token)

    //         // Update the account with new tokens
    //         await prisma.account.update({
    //             where: {
    //                 provider_providerAccountId: {
    //                     provider: 'google',
    //                     providerAccountId: user.accounts[0].providerAccountId,
    //                 },
    //             },
    //             data: {
    //                 access_token: tokens.access_token,
    //                 refresh_token: tokens.refresh_token || refresh_token,
    //                 expires_at: tokens.expiry_date
    //                     ? Math.floor(tokens.expiry_date / 1000)
    //                     : undefined,
    //                 token_type: tokens.token_type,
    //                 scope: tokens.scope,
    //                 id_token: tokens.id_token,
    //             },
    //         })

    //         return res.status(200).json({ tokens })
    //     } catch (error) {
    //         console.error('Token refresh error:', error)
    //         return res.status(500).json({ error: 'Internal server error' })
    //     }
    // }

    static async checkEmail(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const user = await prismaClient.user.findUnique({
                where: { email },
                select: { id: true }
            });

            return res.status(200).json({
                exists: !!user
            });

        } catch (error) {
            console.error('Email check error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async signUp(req: Request, res: Response) {
        try {
            const { email, password, name } = req.body as SignUpInput

            // Check if user already exists
            const existingUser = await prismaClient.user.findUnique({
                where: { email },
            })

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' })
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10)

            // Create user
            const user = await prismaClient.user.create({
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

            res.cookie('token', token);
            res.cookie('user', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name
            }));

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
            const user = await prismaClient.user.findUnique({
                where: { email },
                include: {
                    accounts: {
                        where: {
                            provider: 'credentials',
                        },
                    },
                    ownedCompanies: true,
                    companyMemberships: true,
                },
            })

            console.log(`User`, user);

            if (!user || !user.accounts[0]) {
                return res.status(401).json({ error: 'Invalid credentials' })
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(
                password,
                user.accounts[0].access_token || ''
            )

            console.log(`Is valid password`, isValidPassword);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' })
            }

            const role = user.ownedCompanies.length ? 'admin' : user.companyMemberships.length ? user.companyMemberships[0].role : 'member';

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, role, image: user.image },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1d' }
            )

            res.cookie('token', token);
            res.cookie('user', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                role,
            }));

            return res.status(200).json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role,
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

            const user = await prismaClient.user.findUnique({
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

    // Generate and send OTP
    static async generateOTP(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            // Generate a 6-digit OTP
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

            // Get Prisma instance
            const prisma = await PrismaService.getInstance();

            // Store OTP in the database
            await prisma.oTP.create({
                data: {
                    email,
                    code,
                    expiresAt,
                },
            });

            // Send OTP via email
            await EmailController.sendEmail(req, res);

            return res.status(200).json({ message: 'OTP sent successfully' });
        } catch (error) {
            console.error('Generate OTP error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Verify OTP and log in or sign up
    static async verifyOTP(req: Request, res: Response) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ error: 'Email and OTP code are required' });
            }

            // Get Prisma instance
            const prisma = await PrismaService.getInstance();

            // Find the OTP record
            const otpRecord = await prisma.oTP.findFirst({
                where: {
                    email,
                    code,
                    expiresAt: { gt: new Date() },
                },
            });

            if (!otpRecord) {
                return res.status(400).json({ error: 'Invalid or expired OTP' });
            }

            // Check if user exists
            let user = await prisma.user.findUnique({
                where: { email },
                include: {
                    ownedCompanies: true,
                    companyMemberships: true,
                },
            });

            let newUser = false;
            if (!user) {
                newUser = true;
                await prisma.user.create({
                    data: {
                        email,
                        name: email.split('@')[0],
                        accounts: {
                            create: {
                                type: 'credentials',
                                provider: 'credentials',
                                providerAccountId: email,
                                access_token: jwt.sign({ email }, process.env.JWT_SECRET || 'secret-key'),
                            },
                        },
                    },
                });

            }

            if (!user) {
                return res.status(500).json({ error: 'User creation failed' });
            }

            // Delete the used OTP
            await prisma.oTP.delete({ where: { id: otpRecord.id } });

            // Determine user role
            let role = user.ownedCompanies.length ? 'admin' : user.companyMemberships.length ? user.companyMemberships[0].role : 'member';

            if (newUser) {
                role = 'admin';
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, role, name: user.name, image: user.image },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            res.cookie('token', token);
            res.cookie('user', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role,
            }));

            return res.status(200).json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role,
                },
                newUser,
            });
        } catch (error) {
            console.error('Verify OTP error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}