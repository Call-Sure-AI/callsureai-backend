export class AppError extends Error {
    status: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.status = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}