import { body, param, query } from 'express-validator';
import { validate } from '../validate';

export const conversationValidation = {
    create: validate([
        body('customerPk').isUUID().withMessage('Invalid customer PK'),
        body('agentPk').isUUID().withMessage('Invalid agent PK'),
        body('timeDate').isISO8601().withMessage('Invalid date format'),
        body('duration').isInt({ min: 0 }).withMessage('Duration must be a positive number'),
        body('exchange').isString().trim().notEmpty().withMessage('Exchange content is required'),
        body('transcript').isString().trim().optional(),
        body('file').isString().trim().optional(),
    ]),
    update: validate([
        param('pk').isUUID().withMessage('Invalid conversation PK'),
        body('timeDate').isISO8601().optional(),
        body('duration').isInt({ min: 0 }).optional(),
        body('exchange').isString().trim().optional(),
        body('transcript').isString().trim().optional(),
        body('file').isString().trim().optional(),
    ]),
    getAll: validate([
        query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit value'),
        query('sortBy').optional().isIn(['timeDate', 'duration', 'exchange', 'transcript', 'file']).withMessage('Invalid sort by value'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order value'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format').custom((endDate, { req }) => {
            if (req && req.query && req.query.startDate && endDate) {
                return new Date(endDate) >= new Date(req.query.startDate as string);
            }
            return true;
        }).withMessage('End date must be after start date'),
        query('customerPk').optional().isUUID().withMessage('Invalid customer PK'),
        query('agentPk').optional().isUUID().withMessage('Invalid agent PK')
    ])
};