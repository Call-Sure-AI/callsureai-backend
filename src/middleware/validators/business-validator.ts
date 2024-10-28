import { body, param } from 'express-validator';
import { validate } from '../validate';

export const businessValidation = {
    create: validate([
        body('type').isString().trim().notEmpty().withMessage('Business type is required'),
        body('desc').isString().trim().notEmpty().withMessage('Business description is required'),
        body('report').isString().trim().optional(),
    ]),
    update: validate([
        param('id').isUUID().withMessage('Invalid business ID'),
        body('type').isString().trim().optional(),
        body('desc').isString().trim().optional(),
        body('report').isString().trim().optional(),
    ]),
};