import { body, param } from 'express-validator';
import { validate } from '../validate';

export const agentValidation = {
    create: validate([
        body('name').isString().trim().notEmpty().withMessage('Agent name is required'),
        body('spec').isString().trim().notEmpty().withMessage('Agent specialization is required'),
        body('description').isString().trim().optional(),
    ]),
    update: validate([
        param('id').isUUID().withMessage('Invalid agent ID'),
        body('name').isString().trim().optional(),
        body('spec').isString().trim().optional(),
        body('description').isString().trim().optional(),
    ]),
};