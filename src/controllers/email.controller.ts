import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export class EmailController {
    static async sendEmail(req: Request, res: Response) {
        try {
            const { to, subject, html } = req.body;
            if (!to || !subject || !html) {
                return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
            }

            const transporter = nodemailer.createTransport({
                host: 'smtp.hostinger.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'noreply@callsure.ai',
                    pass: process.env.SMTP_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: {
                    name: 'Callsure AI',
                    address: 'noreply@callsure.ai',
                },
                to,
                subject,
                html,
            });

        } catch (error) {
            console.error('Send email error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
} 