import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient();

export class InvitationController {
    static async generateInvitation(req: Request, res: Response) {
        try {
            const { email, companyId, role } = req.body;

            if (!email || !companyId) {
                return res.status(400).json({ error: 'Email and company ID are required' });
            }

            const company = await prisma.company.findUnique({
                where: { id: companyId }
            });

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            if (company.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to invite users to this company' });
            }

            const token = crypto.randomBytes(32).toString('hex');

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const existingInvitation = await prisma.invitation.findFirst({
                where: {
                    email,
                    company_id: companyId
                }
            });

            let invitation;

            if (existingInvitation) {
                invitation = await prisma.invitation.update({
                    where: { id: existingInvitation.id },
                    data: {
                        token,
                        role: role || existingInvitation.role,
                        expires_at: expiresAt,
                        updated_at: new Date(),
                        status: 'pending' // Reset status if resending
                    }
                });
            } else {
                invitation = await prisma.invitation.create({
                    data: {
                        email,
                        company_id: companyId,
                        role: role || 'member',
                        token,
                        expires_at: expiresAt,
                        status: 'pending'
                    }
                });
            }

            const invitationUrl = `${process.env.FRONTEND_URL}/invite?token=${token}`;

            return res.status(200).json({
                message: 'Invitation created successfully',
                invitationUrl,
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    expires_at: invitation.expires_at
                }
            });

        } catch (error) {
            console.error('Generate invitation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async validateInvitation(req: Request, res: Response) {
        try {
            const { token } = req.params;

            console.log(`Validating invitation with token ${token}`);

            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }

            const invitation = await prisma.invitation.findUnique({
                where: { token },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            business_name: true
                        }
                    }
                }
            });

            if (!invitation) {
                return res.status(404).json({ error: 'Invitation not found' });
            }

            if (new Date() > invitation.expires_at) {
                return res.status(400).json({ error: 'Invitation has expired' });
            }

            if (invitation.status === 'accepted') {
                return res.status(400).json({ error: 'Invitation has already been accepted' });
            }

            return res.status(200).json({
                invitation: {
                    email: invitation.email,
                    company: invitation.company,
                    role: invitation.role,
                    expires_at: invitation.expires_at
                }
            });

        } catch (error) {
            console.error('Validate invitation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async acceptInvitation(req: Request, res: Response) {
        try {
            const { token } = req.params;
            const { name, password } = req.body;

            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }

            const invitation = await prisma.invitation.findUnique({
                where: { token },
                include: {
                    company: true
                }
            });

            if (!invitation) {
                return res.status(404).json({ error: 'Invitation not found' });
            }

            if (new Date() > invitation.expires_at) {
                return res.status(400).json({ error: 'Invitation has expired' });
            }

            if (invitation.status === 'accepted') {
                return res.status(400).json({ error: 'Invitation has already been accepted' });
            }

            let user = await prisma.user.findUnique({
                where: { email: invitation.email }
            });

            const result = await prisma.$transaction(async (tx: any) => {
                if (!user) {
                    if (!password) {
                        throw new Error('Password is required for new users');
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);

                    user = await tx.user.create({
                        data: {
                            email: invitation.email,
                            name: name || invitation.email.split('@')[0],
                            emailVerified: new Date(),
                            accounts: {
                                create: {
                                    type: 'credentials',
                                    provider: 'credentials',
                                    providerAccountId: invitation.email,
                                    access_token: hashedPassword,
                                }
                            }
                        }
                    });
                }

                const company = await tx.company.findUnique({
                    where: { id: invitation.company_id },
                    select: { id: true }
                });

                await tx.companyMember.create({
                    data: {
                        user_id: user?.id,
                        company_id: invitation.company_id,
                        role: invitation.role
                    }
                });

                if (!company) {
                    throw new Error('Company not found');
                }

                await tx.activity.create({
                    data: {
                        user_id: user?.id,
                        action: 'joined_company',
                        entity_type: 'company',
                        entity_id: invitation.company_id,
                        metadata: {
                            role: invitation.role,
                            invitation_id: invitation.id
                        }
                    }
                });

                await tx.invitation.update({
                    where: { id: invitation.id },
                    data: {
                        status: 'accepted',
                        accepted_at: new Date()
                    }
                });

                return user;
            });

            // Generate JWT token
            const signedToken = jwt.sign(
                { id: result?.id, email: result?.email, name: result?.name },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            const COOKIE_OPTIONS = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none' as const,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
                domain: '.callsure.ai'
            };

            res.cookie('token', signedToken);
            res.cookie('user', JSON.stringify({
                id: result?.id,
                email: result?.email,
                name: result?.name,
                image: result?.image
            }));

            return res.status(200).json({
                message: 'Invitation accepted successfully',
                token: signedToken,
                user: {
                    id: result?.id,
                    email: result?.email,
                    name: result?.name,
                    image: result?.image
                }
            });

        } catch (error) {
            console.error('Accept invitation error:', error);
            return res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

    static async listInvitations(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            console.log(`Listing invitations for company ${companyId}`);

            const company = await prisma.company.findUnique({
                where: { id: companyId }
            });

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            if (company.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to view invitations for this company' });
            }

            const invitations = await prisma.invitation.findMany({
                where: {
                    company_id: companyId,
                    expires_at: {
                        gt: new Date()
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            const mappedInvitations = invitations.map((invitation: any) => ({
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                status: invitation.status,
                expires_at: invitation.expires_at,
                created_at: invitation.created_at,
                accepted_at: invitation.accepted_at,
                invitationUrl: `${process.env.FRONTEND_URL}/invite?token=${invitation.token}`
            }));

            return res.status(200).json({
                invitations: mappedInvitations
            });

        } catch (error) {
            console.error('List invitations error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async listAcceptedInvitations(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            console.log(`Listing accepted invitations for company ${companyId}`);

            const company = await prisma.company.findUnique({
                where: { id: companyId }
            });

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            if (company.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to view invitations for this company' });
            }

            const invitations = await prisma.invitation.findMany({
                where: {
                    company_id: companyId,
                    status: 'accepted'
                },
                orderBy: {
                    accepted_at: 'desc'
                }
            });

            const mappedInvitations = invitations.map((invitation: any) => ({
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                accepted_at: invitation.accepted_at,
                created_at: invitation.created_at
            }));

            return res.status(200).json({
                invitations: mappedInvitations
            });

        } catch (error) {
            console.error('List accepted invitations error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // List expired invitations
    static async listExpiredInvitations(req: Request, res: Response) {
        try {
            const { companyId } = req.params;

            const company = await prisma.company.findUnique({
                where: { id: companyId }
            });

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            if (company.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to view invitations for this company' });
            }

            const invitations = await prisma.invitation.findMany({
                where: {
                    company_id: companyId,
                    status: 'pending',
                    expires_at: {
                        lt: new Date()
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            const mappedInvitations = invitations.map((invitation: any) => ({
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expires_at: invitation.expires_at,
                created_at: invitation.created_at
            }));

            return res.status(200).json({
                invitations: mappedInvitations
            });

        } catch (error) {
            console.error('List expired invitations error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Delete an invitation
    static async deleteInvitation(req: Request, res: Response) {
        try {
            const { invitationId } = req.params;

            const invitation = await prisma.invitation.findUnique({
                where: { id: invitationId },
                include: {
                    company: true
                }
            });

            if (!invitation) {
                return res.status(404).json({ error: 'Invitation not found' });
            }

            if (invitation.company.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to delete this invitation' });
            }

            await prisma.invitation.delete({
                where: { id: invitationId }
            });

            return res.status(200).json({
                message: 'Invitation deleted successfully'
            });

        } catch (error) {
            console.error('Delete invitation error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Send invitation email
    static async sendInvitationEmail(req: Request, res: Response) {
        try {
            const { invitationId } = req.body;

            const invitation = await prisma.invitation.findUnique({
                where: { id: invitationId },
                include: {
                    company: true
                }
            });

            if (!invitation) {
                return res.status(404).json({ error: 'Invitation not found' });
            }

            if (invitation.company.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to send emails for this invitation' });
            }

            const invitationUrl = `${process.env.FRONTEND_URL}/invite?token=${invitation.token}`;

            console.log(`Sending invitation to ${invitation.email} for company ${invitation.company.name}`);
            console.log(`Invitation URL: ${invitationUrl}`);
            console.log(`SMTP password exists: ${!!process.env.SMTP_PASSWORD}`);


            const transporter = nodemailer.createTransport({
                host: "smtp.hostinger.com",
                port: 465,
                secure: true,
                auth: {
                    user: "noreply@callsure.ai",
                    pass: process.env.SMTP_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: {
                    name: "Callsure AI",
                    address: "noreply@callsure.ai",
                },
                to: invitation.email,
                subject: `You've been invited to join ${invitation.company.name}`,
                html: `
                <div>
                    <h1>You've been invited to join ${invitation.company.name}</h1>
                    <p>You've been invited to join ${invitation.company.business_name} as a ${invitation.role}.</p>
                    <p>Click the link below to accept the invitation:</p>
                    <p><a href="${invitationUrl}">Accept Invitation</a></p>
                    <p>This invitation will expire on ${invitation.expires_at.toLocaleDateString()}.</p>
                    </div>
                `
            });


            return res.status(200).json({
                message: 'Invitation email sent successfully'
            });

        } catch (error) {
            console.error('Send invitation email error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}