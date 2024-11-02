import { body, param } from 'express-validator';
import { validate } from '../validate';

export const customerValidation = {
    create: validate([
        body('name').isString().trim().notEmpty().withMessage('Customer name is required'),
        body('description').isString().trim().optional(),
    ]),
    update: validate([
        param('pk').isUUID().withMessage('Invalid customer PK'),
        body('name').isString().trim().optional(),
        body('description').isString().trim().optional(),
    ]),
};
