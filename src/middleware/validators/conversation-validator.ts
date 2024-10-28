import { body, param, query } from 'express-validator';
import { validate } from '../validate';

export const conversationValidation = {
    create: validate([
        body('custAgentId').isUUID().withMessage('Invalid customer-agent connection ID'),
        body('timeDate').isISO8601().withMessage('Invalid date format'),
        body('duration').isInt({ min: 0 }).withMessage('Duration must be a positive number'),
        body('exchange').isString().trim().notEmpty().withMessage('Exchange content is required'),
        body('transcript').isString().trim().optional(),
        body('file').isString().trim().optional(),
    ]),
    update: validate([
        param('id').isUUID().withMessage('Invalid conversation ID'),
        body('timeDate').isISO8601().optional(),
        body('duration').isInt({ min: 0 }).optional(),
        body('exchange').isString().trim().optional(),
        body('transcript').isString().trim().optional(),
        body('file').isString().trim().optional(),
    ]),
    getAll: validate([
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format').custom((endDate, { req }) => {
            if (req && req.query && req.query.startDate && endDate) {
                return new Date(endDate) >= new Date(req.query.startDate as string);
            }
            return true;
        }).withMessage('End date must be after start date'),
        query('customerId').optional().isUUID().withMessage('Invalid customer ID'),
        query('agentId').optional().isUUID().withMessage('Invalid agent ID')
    ])
};