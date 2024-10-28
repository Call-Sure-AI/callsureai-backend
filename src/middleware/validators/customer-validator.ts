import { body, param } from 'express-validator';
import { validate } from '../validate';

export const customerValidation = {
    create: validate([
        body('name').isString().trim().notEmpty().withMessage('Customer name is required'),
        body('description').isString().trim().optional(),
    ]),
    update: validate([
        param('id').isUUID().withMessage('Invalid customer ID'),
        body('name').isString().trim().optional(),
        body('description').isString().trim().optional(),
    ]),
};
